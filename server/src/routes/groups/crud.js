import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import { requireAuth, optionalAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { notify } from './shared.js'
import { maskAvatar } from '../../lib/avatarVisibility.js'

const router = Router()

// 群組物件裡的 host / members[].user 都是「別人」看得到的資料，統一在這裡套用大頭照遮罩
function maskGroupAvatars(group) {
  return {
    ...group,
    ...(group.host && { host: maskAvatar(group.host) }),
    ...(group.members && { members: group.members.map(m => ({ ...m, user: maskAvatar(m.user) })) }),
  }
}

const createGroupSchema = z.object({
  serviceId:      z.string().min(1),
  planId:         z.string().optional(),
  planName:       z.string().min(1),
  // 接受前端的 totalSeats 或標準的 maxMembers
  maxMembers:     z.number().int().min(2).max(10).optional(),
  totalSeats:     z.number().int().min(2).max(10).optional(),
  // 接受前端的 pricePerSeat 或標準的 monthlyFee
  monthlyFee:     z.number().min(0).optional(),
  pricePerSeat:   z.number().min(0).optional(),
  currency:       z.string().default('TWD'),
  rules:          z.union([z.string(), z.array(z.string())]).optional(),
  tags:           z.array(z.string()).optional(),
  minCreditScore: z.number().int().min(0).default(0),
  minGroupAge:    z.number().int().min(0).default(0),
  billingCycle:   z.enum(['monthly', 'yearly']).optional(),
}).transform(data => ({
  ...data,
  maxMembers:  data.maxMembers  ?? data.totalSeats  ?? 6,
  monthlyFee:  data.monthlyFee  ?? data.pricePerSeat ?? 0,
  planId:      data.planId      ?? data.planName,
  rules:       Array.isArray(data.rules) ? data.rules.join('\n') : (data.rules ?? ''),
  tags:        data.tags ?? [],
  billingCycle: data.billingCycle ?? 'monthly',
}))

const updateGroupSchema = z.object({
  status:          z.enum(['recruiting','full','pending_confirmation','pending_activation','active','confirming','disputed','cancelled','ended']).optional(),
  billingCycle:    z.enum(['monthly', 'yearly']).optional(),
  nextBillingDate: z.string().optional(),
})

// GET /groups — 探索群組（公開）
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { serviceId, category, status = 'recruiting', q } = req.query

    const groups = await prisma.group.findMany({
      where: {
        // status=all 時不過濾狀態，讓已登入用戶的群組 store 能取得所有群組
        ...(status !== 'all' && { status }),
        ...(serviceId && { serviceId }),
        // MySQL 預設 collation（utf8mb4_unicode_ci／general_ci）本身就不分大小寫，
        // mode: 'insensitive' 是 PostgreSQL/MongoDB 專屬選項，MySQL 上會直接丟出驗證錯誤
        ...(q && {
          OR: [
            { service: { name: { contains: q } } },
            { planName:  { contains: q } },
          ],
        }),
        ...(category && { service: { category } }),
      },
      include: {
        host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
        service: true,
        _count:  { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(groups.map(maskGroupAvatars))
  } catch (err) { next(err) }
})

// GET /groups/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
        service: true,
        members: {
          include: { user: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, bio: true } } },
        },
      },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })

    // 惰性自動撥款：confirming 且 confirmDeadline 已到期（callback 式 transaction 以 status 重查保持冪等）
    if (group.status === 'confirming' && group.confirmDeadline && new Date(group.confirmDeadline) <= new Date()) {
      const released = await prisma.$transaction(async (tx) => {
        const fresh = await tx.group.findUnique({ where: { id: group.id }, select: { status: true, escrowTokens: true } })
        if (fresh?.status !== 'confirming') return false // 已被其他請求處理，跳過
        await tx.group.update({ where: { id: group.id }, data: { status: 'active', confirmDeadline: null, escrowTokens: 0 } })
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
      return res.json(maskGroupAvatars({ ...group, status: 'active', confirmDeadline: null, escrowTokens: 0 }))
    }

    res.json(maskGroupAvatars(group))
  } catch (err) { next(err) }
})

// POST /groups
router.post('/', requireAuth, validate(createGroupSchema), async (req, res, next) => {
  try {
    // 過濾前端送來的非資料庫欄位，只留 Prisma schema 接受的欄位
    const allowed = ['serviceId','planId','planName','maxMembers','monthlyFee','currency','rules','tags','minCreditScore','minGroupAge','billingCycle']
    const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))
    const group = await prisma.group.create({
      data: { ...data, hostId: req.user.id },
      include: { service: true, host: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } } },
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
})

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

// PATCH /groups/:id
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
      group.members.forEach(m => {
        notify({
          userId:  m.userId,
          type:    'group_ended',
          title:   '群組已結束',
          message: `「${groupLabel}」群組已由團主結束，合購服務將不再續訂。`,
          meta:    { groupId: req.params.id },
        })
      })
    }

    res.json(updated)
  } catch (err) { next(err) }
})

// GET /groups/:id/transactions — 團主查看該群組所有成員的PM幣代管/撥款/退款紀錄（收款管理面板）
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
})

// DELETE /groups/:id — 僅能刪除尚無成員加入的招募中群組，已有成員／已鎖定請走 /cancel（含退款）
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
})

export default router
