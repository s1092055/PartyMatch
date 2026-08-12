import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import { requireAuth, optionalAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { notify } from './shared.js'
import { maskAvatar } from '../../lib/avatarVisibility.js'
import { maskGroupListSensitiveFields, maskGroupDetailSensitiveFields, resolveGroupMemberEvidenceUrls } from '../../lib/groupPrivacy.js'
import { computeSeatCost, toPlainGroup } from '../../utils/pricing.js'
import { refundEscrow } from '../../utils/membership.js'
import { adjustCreditScore } from '../../utils/creditScore.js'

const router = Router()

// 群組物件裡的 host / members[].user 都是「別人」看得到的資料，統一在這裡套用大頭照遮罩，
// 順便把 Decimal 型別的 monthlyFee 轉回 number（見 toPlainGroup）
function maskGroupAvatars(group) {
  return toPlainGroup({
    ...group,
    ...(group.host && { host: maskAvatar(group.host) }),
    ...(group.members && { members: group.members.map(m => ({ ...m, user: maskAvatar(m.user) })) }),
  })
}

// maxMembers/monthlyFee/currency/billingCycle 刻意不放進這個 schema：zod 預設會把沒宣告在
// schema 裡的欄位整個丟掉，就算前端在請求裡塞了這些欄位也不會活過 validate() 這一關，
// 實際寫入 DB 的值一律由 resolvePlanPricing() 從後端自己的 Service.plans 權威資料算出來
const createGroupSchema = z.object({
  serviceId:      z.string().min(1),
  planName:       z.string().min(1),
  rules:          z.union([z.string(), z.array(z.string())]).optional(),
  tags:           z.array(z.string()).optional(),
  minCreditScore: z.number().int().min(0).default(0),
  minGroupAge:    z.number().int().min(0).default(0),
}).transform(data => ({
  ...data,
  rules: Array.isArray(data.rules) ? data.rules.join('\n') : (data.rules ?? ''),
  tags:  data.tags ?? [],
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

    res.json(maskGroupListSensitiveFields(groups.map(maskGroupAvatars)))
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
        // 用條件式 updateMany 當真正的樂觀鎖（而不是上面單純的讀取判斷）：上面的 findUnique 只是
        // 快照讀取，不會鎖住這一列，真正防止兩個請求同時撥款兩次的是這裡 WHERE 裡的 status 條件
        const claimed = await tx.group.updateMany({
          where: { id: group.id, status: 'confirming' },
          data:  { status: 'active', confirmDeadline: null, escrowTokens: 0 },
        })
        if (claimed.count === 0) return false // 已被其他請求搶先撥款
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

    // 惰性自動踢除：pending_confirmation 且 serviceInfoDeadline 已到期，把還沒填寫／提取帳號資訊的
    // 成員移出群組並退款、狀態退回 recruiting 讓團主可以重新招募補位。這個狀態鎖定後任何人都不能
    // 自己退出（canLeaveGroup 只涵蓋 recruiting/full），沒有這層機制的話，只要一位成員不回應，
    // 其他已經填完的成員、代管費用會一起被卡死，永遠等不到團主重新鎖定
    if (group.status === 'pending_confirmation' && group.serviceInfoDeadline && new Date(group.serviceInfoDeadline) <= new Date()) {
      const stalled = group.members.filter(m => m.serviceInfo == null)
      if (stalled.length > 0) {
        const seatCost = computeSeatCost(group)
        const removed = await prisma.$transaction(async (tx) => {
          // 條件式搶佔：避免跟「剛好在逾期前一刻全員填完」的併發請求互相打架
          const claimed = await tx.group.updateMany({
            where: { id: group.id, status: 'pending_confirmation' },
            data:  { status: 'recruiting', serviceInfoDeadline: null, currentMembers: { decrement: stalled.length } },
          })
          if (claimed.count === 0) return [] // 已被其他請求處理過

          for (const m of stalled) {
            // 逐一重新讀取 escrowTokens 才夾住退款金額，避免前一位成員退款後金額被沿用成舊值
            const fresh = await tx.group.findUnique({ where: { id: group.id }, select: { escrowTokens: true } })
            const refundAmount = Math.min(seatCost, fresh?.escrowTokens ?? 0)
            await tx.member.delete({ where: { id: m.id } })
            await refundEscrow(tx, { userId: m.userId, groupId: group.id, amount: refundAmount, note: '逾期未完成帳號資訊填寫，自動移出群組並退款' })
            // 信用分數：跟團主手動移除共用同一條「被移除出群組」規則——站在被踢除成員的角度，
            // 兩種途徑的後果對他來說是同一件事
            await adjustCreditScore(tx, { userId: m.userId, delta: -10, reason: '被移除出群組', groupId: group.id })
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
              host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
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
})

// 建立群組時絕對不能相信前端送來的 monthlyFee/maxMembers/currency/billingCycle：這些是
// 直接決定金流（代管扣款、續訂金額）的欄位，前端不經過 UI、直接打 API 就能自己填任意數字。
// 一律從後端自己的 Service.plans（權威資料來源）依 planName 找出對應方案，欄位全部從那裡覆蓋，
// 前端傳的同名欄位只當作「使用者想選哪個方案」的意圖，不當作實際要寫入的值。
// planName 目前的文案慣例固定包含「（月繳）」/「（年繳）」字尾（見 CLAUDE.md 重要慣例），
// billingCycle 也一併從這裡判斷，不採信前端傳的值，避免用月繳的 billingCycle 套用年繳方案的
// 單期價格、少扣 12 倍的金額
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

// POST /groups
router.post('/', requireAuth, validate(createGroupSchema), async (req, res, next) => {
  try {
    const pricing = await resolvePlanPricing(req.body.serviceId, req.body.planName)
    if (!pricing) return res.status(400).json({ message: '找不到對應的服務方案' })

    // 過濾前端送來的非資料庫欄位，只留 Prisma schema 接受的欄位；價格相關欄位一律用上面
    // resolvePlanPricing() 算出來的權威值覆蓋，即使前端在請求裡塞了不同的值也不會生效
    const allowed = ['serviceId','rules','tags','minCreditScore','minGroupAge']
    const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))
    const group = await prisma.group.create({
      data: { ...data, ...pricing, hostId: req.user.id },
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

    res.json(toPlainGroup(updated))
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
