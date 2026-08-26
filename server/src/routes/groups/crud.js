import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import redis from '../../lib/redis.js'
import { requireAuth, optionalAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { notify, notifyBatch } from './shared.js'
import { maskAvatar } from '../../lib/avatarVisibility.js'
import { maskGroupListSensitiveFields, maskGroupDetailSensitiveFields, resolveGroupMemberEvidenceUrls, HOST_PUBLIC_SELECT } from '../../lib/groupPrivacy.js'
import { computeSeatCost, toPlainGroup } from '../../utils/pricing.js'
import { refundEscrow } from '../../utils/membership.js'
import { adjustCreditScore } from '../../utils/creditScore.js'

const router = Router()

function maskGroupAvatars(group) {
  return toPlainGroup({
    ...group,
    ...(group.host && { host: maskAvatar(group.host) }),
    ...(group.members && { members: group.members.map(m => ({ ...m, user: maskAvatar(m.user) })) }),
  })
}

const createGroupSchema = z.object({
  serviceId:      z.string().min(1),
  planName:       z.string().min(1),
  maxMembers:     z.number().int().min(2).optional(),
  rules:          z.union([z.string(), z.array(z.string())]).optional(),
  tags:           z.array(z.string()).optional(),
  minCreditScore: z.number().int().min(0).default(0),
  minGroupAge:    z.number().int().min(0).default(0),
}).transform(data => ({
  ...data,
  rules: Array.isArray(data.rules) ? data.rules.join('\n') : (data.rules ?? ''),
  tags:  data.tags ?? [],
}));

const updateGroupSchema = z.object({
  status:          z.enum(['recruiting','full','pending_confirmation','pending_activation','active','confirming','disputed','cancelled','ended']).optional(),
  billingCycle:    z.enum(['monthly', 'yearly']).optional(),
  nextBillingDate: z.string().optional(),
})

const GROUP_LIST_SERVICE_SELECT = { id: true, name: true, category: true, logoUrl: true };

const GROUP_LIST_CACHE_TTL_SECONDS = 20;

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { serviceId, category, status = 'recruiting', q } = req.query
    const cacheKey = `groups:list:${JSON.stringify({ serviceId: serviceId ?? '', category: category ?? '', status, q: q ?? '' })}`

    const cached = await redis.get(cacheKey).catch(() => null)
    if (cached) {
      res.json(JSON.parse(cached))
      return
    }

    const groups = await prisma.group.findMany({
      where: {
        ...(status !== 'all' && { status }),
        ...(serviceId && { serviceId }),
        ...(q && {
          OR: [
            { service: { name: { contains: q } } },
            { planName:  { contains: q } },
          ],
        }),
        ...(category && { service: { category } }),
      },
      include: {
        host:    HOST_PUBLIC_SELECT,
        service: { select: GROUP_LIST_SERVICE_SELECT },
        _count:  { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const payload = maskGroupListSensitiveFields(groups.map(maskGroupAvatars))
    redis.setex(cacheKey, GROUP_LIST_CACHE_TTL_SECONDS, JSON.stringify(payload)).catch(() => {})
    res.json(payload)
  } catch (err) { next(err) }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        host:    HOST_PUBLIC_SELECT,
        service: true,
        members: {
          include: { user: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, bio: true } } },
        },
      },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })

    if (group.status === 'confirming' && group.confirmDeadline && new Date(group.confirmDeadline) <= new Date()) {
      const released = await prisma.$transaction(async (tx) => {
        const fresh = await tx.group.findUnique({ where: { id: group.id }, select: { status: true, escrowTokens: true } })
        if (fresh?.status !== 'confirming')
          return false;
        const claimed = await tx.group.updateMany({
          where: { id: group.id, status: 'confirming' },
          data:  { status: 'active', confirmDeadline: null, escrowTokens: 0 },
        });
        if (claimed.count === 0)
          return false;
        await tx.user.update({ where: { id: group.hostId }, data: { tokenBalance: { increment: fresh.escrowTokens } } })
        await tx.tokenTransaction.create({
          data: { userId: group.hostId, type: 'release', amount: fresh.escrowTokens, relatedGroupId: group.id, note: '確認期逾期，自動撥款' },
        })
        await tx.subscription.updateMany({ where: { groupId: group.id }, data: { status: 'active' } })
        return true
      })
      if (released) {
        const groupLabel = group.planName ?? group.service?.name ?? ''
        notify({
          userId:  group.hostId,
          type:    'escrow_released',
          title:   '代管款項已撥款',
          message: `「${groupLabel}」確認期已逾期，代管款項已自動撥入你的PM幣餘額。`,
          meta:    { groupId: group.id },
        })
      }
      return res.json(await resolveGroupMemberEvidenceUrls(maskGroupDetailSensitiveFields(maskGroupAvatars({ ...group, status: 'active', confirmDeadline: null, escrowTokens: 0 }), req.user?.id)))
    }

    if (group.status === 'pending_confirmation' && group.serviceInfoDeadline && new Date(group.serviceInfoDeadline) <= new Date()) {
      const stalled = group.members.filter(m => m.serviceInfo == null)
      if (stalled.length > 0) {
        const seatCost = computeSeatCost(group)
        const removed = await prisma.$transaction(async (tx) => {
          const claimed = await tx.group.updateMany({
            where: { id: group.id, status: 'pending_confirmation' },
            data:  { status: 'recruiting', serviceInfoDeadline: null, currentMembers: { decrement: stalled.length } },
          });
          if (claimed.count === 0)
            return [];

          let remainingEscrow = group.escrowTokens
          for (const m of stalled) {
            const refundAmount = Math.min(seatCost, remainingEscrow)
            remainingEscrow -= refundAmount
            await tx.member.delete({ where: { id: m.id } })
            await refundEscrow(tx, { userId: m.userId, groupId: group.id, amount: refundAmount, note: '逾期未完成帳號資訊填寫，自動移出群組並退款' })
            await adjustCreditScore(tx, { userId: m.userId, delta: -10, reason: '被移除出群組', groupId: group.id });
            await tx.application.updateMany({
              where: { groupId: group.id, userId: m.userId, status: 'approved' },
              data:  { status: 'removed', activeKey: null },
            })
          }
          return stalled
        })

        if (removed.length > 0) {
          const groupLabel = group.planName ?? group.service?.name ?? ''
          removed.forEach(m => {
            notify({
              userId:  m.userId,
              type:    'member_removed',
              title:   '已被移出群組',
              message: `「${groupLabel}」群組因你逾期未完成帳號資訊填寫，已被自動移出，代管費用已退還至你的PM幣餘額，可以重新申請或選擇其他群組。`,
              meta:    { groupId: group.id },
            })
          })
          notify({
            userId:  group.hostId,
            type:    'service_info_deadline_passed',
            title:   '成員逾期未完成，已自動移出',
            message: `「${groupLabel}」群組有 ${removed.length} 位成員逾期未完成帳號資訊填寫，已自動移出並退款，群組已重新開放招募補位。`,
            meta:    { groupId: group.id },
          })
          const fresh = await prisma.group.findUnique({
            where: { id: group.id },
            include: {
              host:    HOST_PUBLIC_SELECT,
              service: true,
              members: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, bio: true } } } },
            },
          })
          return res.json(await resolveGroupMemberEvidenceUrls(maskGroupDetailSensitiveFields(maskGroupAvatars(fresh), req.user?.id)))
        }
      }
    }

    res.json(await resolveGroupMemberEvidenceUrls(maskGroupDetailSensitiveFields(maskGroupAvatars(group), req.user?.id)))
  } catch (err) { next(err) }
});

async function resolvePlanPricing(serviceId, planName) {
  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { plans: true } })
  if (!service) return null
  const plan = service.plans.find(p => p.name === planName)
  if (!plan) return null
  return {
    planId:       plan.id,
    planName:     plan.name,
    maxMembers:   plan.maxMembers,
    monthlyFee:   plan.monthlyFee,
    currency:     plan.currency ?? 'TWD',
    billingCycle: plan.name.includes('年繳') ? 'yearly' : 'monthly',
  }
}

router.post('/', requireAuth, validate(createGroupSchema), async (req, res, next) => {
  try {
    const pricing = await resolvePlanPricing(req.body.serviceId, req.body.planName)
    if (!pricing) return res.status(400).json({ message: '找不到對應的服務方案' })

    // maxMembers 允許團主在方案原本的容量內縮小開放名額（例如 5 人方案只開放給 2 人），
    // 但不能超過方案容量——monthlyFee/currency/billingCycle 依然完全由 pricing 決定，
    // 每人單價不會因為名額變動而改變，不會重新開放前端夾帶價格的漏洞
    if (req.body.maxMembers != null) {
      if (req.body.maxMembers > pricing.maxMembers) {
        return res.status(400).json({ message: `開放名額不能超過方案容量（最多 ${pricing.maxMembers} 人）` })
      }
      pricing.maxMembers = req.body.maxMembers
    }

    const allowed = ['serviceId','rules','tags','minCreditScore','minGroupAge'];
    const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))
    const group = await prisma.group.create({
      data: { ...data, ...pricing, hostId: req.user.id },
      include: { service: true, host: HOST_PUBLIC_SELECT },
    })

    notify({
      userId:  req.user.id,
      type:    'group_created',
      title:   '群組已成功建立',
      message: `「${group.planName ?? group.service?.name ?? ''}」群組已上架，開始招募成員中！`,
      meta:    { groupId: group.id },
    })

    res.status(201).json(maskGroupAvatars(group))
  } catch (err) { next(err) }
});

const ALLOWED_TRANSITIONS = {
  recruiting:           ['full', 'cancelled'],
  full:                 ['recruiting', 'pending_confirmation', 'cancelled'],
  pending_confirmation: ['pending_activation'],
  pending_activation:   ['active'],
  active:               ['confirming', 'ended', 'pending_confirmation'],
  confirming:           ['active', 'disputed', 'cancelled'],
  disputed:             ['confirming', 'active', 'cancelled', 'ended'],
  cancelled:            [],
  ended:                [],
}

router.patch('/:id', requireAuth, validate(updateGroupSchema), async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: true, service: { select: { name: true } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })

    const { status } = req.body
    if (status && status !== group.status) {
      const allowed = ALLOWED_TRANSITIONS[group.status] ?? []
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: `不允許從 ${group.status} 轉換為 ${status}` })
      }
    }

    const updated = await prisma.group.update({
      where: { id: req.params.id },
      data:  req.body,
    })

    if (status === 'ended' && group.status !== 'ended') {
      const groupLabel = group.planName ?? group.service?.name ?? ''
      await notifyBatch(group.members.map(m => ({
        userId:  m.userId,
        type:    'group_ended',
        title:   '群組已結束',
        message: `「${groupLabel}」群組已由團主結束，合購服務將不再續訂。`,
        meta:    { groupId: req.params.id },
      })))
    }

    res.json(toPlainGroup(updated))
  } catch (err) { next(err) }
});

router.get('/:id/transactions', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id }, select: { hostId: true } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可查看' })

    const transactions = await prisma.tokenTransaction.findMany({
      where:   { relatedGroupId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, avatarInitial: true, avatarColor: true, showAvatar: true, presenceStatus: true } } },
    })
    res.json(transactions.map(t => ({ ...t, user: maskAvatar(t.user) })))
  } catch (err) { next(err) }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'recruiting' || group.currentMembers > 0) {
      return res.status(400).json({ message: '群組已有成員加入或已鎖定，請改用解散群組功能' })
    }

    await prisma.group.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
});

export default router
