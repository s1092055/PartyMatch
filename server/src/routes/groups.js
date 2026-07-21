import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { computeSeatCost } from '../utils/pricing.js'

const router = Router()

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

const disputeSchema = z.object({
  reason:      z.string().trim().min(1).max(500),
  evidenceUrl: z.string().url().optional(),
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
        host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
        service: true,
        _count:  { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(groups)
  } catch (err) { next(err) }
})

// GET /groups/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
        service: true,
        members: {
          include: { user: { select: { id: true, name: true, avatarColor: true, avatarInitial: true } } },
        },
      },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })

    // 惰性自動撥款：confirming 且 confirmDeadline 已到期（callback 式 transaction 以 status 重查保持冪等）
    if (group.status === 'confirming' && group.confirmDeadline && new Date(group.confirmDeadline) <= new Date()) {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.group.findUnique({ where: { id: group.id }, select: { status: true, escrowTokens: true } })
        if (fresh?.status !== 'confirming') return // 已被其他請求處理，跳過
        await tx.group.update({ where: { id: group.id }, data: { status: 'active', confirmDeadline: null, escrowTokens: 0 } })
        await tx.user.update({ where: { id: group.hostId }, data: { tokenBalance: { increment: fresh.escrowTokens } } })
        await tx.tokenTransaction.create({
          data: { userId: group.hostId, type: 'release', amount: fresh.escrowTokens, relatedGroupId: group.id, note: '確認期逾期，自動撥款' },
        })
        await tx.subscription.updateMany({ where: { groupId: group.id }, data: { status: 'active' } })
      })
      return res.json({ ...group, status: 'active', confirmDeadline: null, escrowTokens: 0 })
    }

    res.json(group)
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
      include: { service: true, host: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } } },
    })
    res.status(201).json(group)
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
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
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
    res.json(updated)
  } catch (err) { next(err) }
})

// POST /groups/:id/activate — pending_activation → confirming（48h 確認期開始）
router.post('/:id/activate', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'pending_activation') return res.status(400).json({ message: `群組狀態為 ${group.status}，無法啟用（需為 pending_activation）` })

    const confirmDeadline = new Date()
    confirmDeadline.setHours(confirmDeadline.getHours() + 48)

    const updated = await prisma.group.update({
      where: { id: req.params.id },
      data: { status: 'confirming', confirmDeadline },
      include: {
        host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
        service: true,
        _count:  { select: { members: true } },
      },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

// POST /groups/:id/confirm — 成員確認服務正常（confirming 期間）
router.post('/:id/confirm', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: true, host: { select: { id: true } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'confirming') return res.status(400).json({ message: `群組狀態為 ${group.status}，不在確認期` })

    const member = group.members.find(m => m.userId === req.user.id)
    if (!member) return res.status(403).json({ message: '你不是此群組成員' })

    const now = new Date()

    // 標記此成員已確認
    await prisma.member.update({
      where: { id: member.id },
      data:  { confirmedAt: now },
    })

    // 確認全員是否都已確認（含剛才更新的成員）
    const updatedMembers = await prisma.member.findMany({ where: { groupId: req.params.id } })
    const allConfirmed   = updatedMembers.every(m => m.id === member.id ? true : m.confirmedAt != null)
    const deadlinePassed = group.confirmDeadline && new Date(group.confirmDeadline) <= now

    if (allConfirmed || deadlinePassed) {
      // 撥款：escrowTokens → host.tokenBalance
      const [updated] = await prisma.$transaction([
        prisma.group.update({
          where: { id: req.params.id },
          data:  { status: 'active', confirmDeadline: null },
          include: {
            host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
            service: true,
            _count:  { select: { members: true } },
          },
        }),
        prisma.user.update({
          where: { id: group.host.id },
          data:  { tokenBalance: { increment: group.escrowTokens } },
        }),
        prisma.group.update({
          where: { id: req.params.id },
          data:  { escrowTokens: 0 },
        }),
        prisma.tokenTransaction.create({
          data: {
            userId:        group.host.id,
            type:          'release',
            amount:        group.escrowTokens,
            relatedGroupId: req.params.id,
            note:          '確認期結束，代管款項撥付',
          },
        }),
        prisma.subscription.updateMany({
          where: { groupId: req.params.id },
          data:  { status: 'active' },
        }),
      ])
      return res.json({ group: { ...updated, escrowTokens: 0 }, released: true })
    }

    res.json({ group: null, released: false })
  } catch (err) { next(err) }
})

// POST /groups/:id/dispute — 成員申訴（confirming → disputed）
router.post('/:id/dispute', requireAuth, validate(disputeSchema), async (req, res, next) => {
  try {
    const { reason, evidenceUrl } = req.body

    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'confirming') return res.status(400).json({ message: `群組狀態為 ${group.status}，不在確認期` })

    const member = group.members.find(m => m.userId === req.user.id)
    if (!member) return res.status(403).json({ message: '你不是此群組成員' })

    const disputeDeadline = new Date()
    disputeDeadline.setDate(disputeDeadline.getDate() + 3)

    const [updated] = await prisma.$transaction([
      prisma.group.update({
        where: { id: req.params.id },
        data:  { status: 'disputed', disputeDeadline },
        include: {
          host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
          service: true,
          _count:  { select: { members: true } },
        },
      }),
      prisma.member.update({
        where: { id: member.id },
        data:  {
          serviceInfoIssueNote: reason.trim(),
          ...(evidenceUrl ? { disputeEvidenceUrl: evidenceUrl } : {}),
        },
      }),
    ])

    res.json(updated)
  } catch (err) { next(err) }
})

// POST /groups/:id/cancel — 解散群組（啟用前），退還所有代管給成員
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where:   { id: req.params.id },
      include: { members: { include: { user: { select: { id: true } } } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可解散群組' })

    const cancellable = ['recruiting', 'full']
    if (!cancellable.includes(group.status)) {
      return res.status(400).json({ message: `群組已鎖定（狀態為 ${group.status}），無法解散` })
    }

    // 計算每位成員的退款金額（席位費用）
    const seatCost = computeSeatCost(group)

    await prisma.$transaction([
      prisma.group.update({ where: { id: req.params.id }, data: { status: 'cancelled', escrowTokens: 0 } }),
      ...group.members.map(m =>
        prisma.user.update({ where: { id: m.userId }, data: { tokenBalance: { increment: seatCost } } })
      ),
      ...group.members.map(m =>
        prisma.tokenTransaction.create({
          data: {
            userId:        m.userId,
            type:          'refund',
            amount:        seatCost,
            relatedGroupId: req.params.id,
            note:          '群組解散，代管退款',
          },
        })
      ),
    ])

    res.json({ status: 'cancelled' })
  } catch (err) { next(err) }
})

// POST /groups/:id/lock — full → pending_confirmation
router.post('/:id/lock', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'full') return res.status(400).json({ message: `群組狀態為 ${group.status}，無法鎖定（需為 full）` })

    // 設定下次扣款日（從今天起算一個計費週期）
    const nextBillingDate = new Date()
    if (group.billingCycle === 'yearly') nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    // 填寫服務帳號資訊的期限：鎖定時間 + 24h（僅供前端顯示倒數，逾期不會自動處理）
    const serviceInfoDeadline = new Date()
    serviceInfoDeadline.setHours(serviceInfoDeadline.getHours() + 24)

    // 更新群組狀態 + 所有成員訂閱的 nextBillingDate
    const [updated] = await prisma.$transaction([
      prisma.group.update({
        where: { id: req.params.id },
        data: { status: 'pending_confirmation', serviceInfoDeadline },
        include: {
          host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
          service: true,
          _count:  { select: { members: true } },
        },
      }),
      prisma.subscription.updateMany({
        where: { groupId: req.params.id },
        data:  { nextBillingDate },
      }),
    ])

    res.json(updated)
  } catch (err) { next(err) }
})

// POST /groups/:id/adjudicate — 平台裁定申訴（需管理員）
// winner: 'member' → 退款給申訴成員並移出群組；'host' → 撥款給團主
router.post('/:id/adjudicate', requireAdmin, async (req, res, next) => {
  try {
    const { winner, reason } = req.body
    if (!['member', 'host'].includes(winner)) return res.status(400).json({ message: 'winner 必須為 member 或 host' })
    if (!reason?.trim()) return res.status(400).json({ message: '請填寫裁定說明' })

    const group = await prisma.group.findUnique({
      where:   { id: req.params.id },
      include: { members: { include: { user: { select: { id: true } } } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'disputed') return res.status(400).json({ message: `群組狀態為 ${group.status}，不在申訴期` })

    // 找申訴成員（有 serviceInfoIssueNote 的那位）
    const disputeMember = group.members.find(m => m.serviceInfoIssueNote)
    if (!disputeMember) return res.status(400).json({ message: '找不到申訴成員' })

    const seatCost = computeSeatCost(group)

    if (winner === 'member') {
      // 退款給申訴成員，移出群組，其他人代管不變，群組回 active
      await prisma.$transaction([
        prisma.group.update({
          where: { id: group.id },
          data:  { status: 'active', disputeDeadline: null, escrowTokens: { decrement: seatCost } },
        }),
        prisma.user.update({
          where: { id: disputeMember.userId },
          data:  { tokenBalance: { increment: seatCost } },
        }),
        prisma.tokenTransaction.create({
          data: { userId: disputeMember.userId, type: 'refund', amount: seatCost, relatedGroupId: group.id, note: `申訴裁定：${reason.trim()}` },
        }),
        prisma.member.delete({ where: { id: disputeMember.id } }),
        prisma.subscription.updateMany({
          where: { groupId: group.id, userId: disputeMember.userId },
          data:  { status: 'cancelled' },
        }),
      ])
    } else {
      // 撥款給團主，群組回 active，全員訂閱啟用
      await prisma.$transaction([
        prisma.group.update({
          where: { id: group.id },
          data:  { status: 'active', disputeDeadline: null, escrowTokens: 0 },
        }),
        prisma.user.update({
          where: { id: group.hostId },
          data:  { tokenBalance: { increment: group.escrowTokens } },
        }),
        prisma.tokenTransaction.create({
          data: { userId: group.hostId, type: 'release', amount: group.escrowTokens, relatedGroupId: group.id, note: `申訴裁定：${reason.trim()}` },
        }),
        prisma.subscription.updateMany({ where: { groupId: group.id }, data: { status: 'active' } }),
      ])
    }

    res.json({ winner, disputeMemberId: disputeMember.userId })
  } catch (err) { next(err) }
})

// POST /groups/:id/renew — active → pending_confirmation，向每位成員收取本期代管費用並重置帳號資訊
router.post('/:id/renew', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: { include: { user: { select: { id: true, tokenBalance: true } } } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'active') return res.status(400).json({ message: `群組狀態為 ${group.status}，無法開始新一期（需為 active）` })

    const seatCost = computeSeatCost(group)

    const memberIds = group.members.map(m => m.userId)
    const insufficient = group.members.filter(m => m.user.tokenBalance < seatCost)
    if (insufficient.length > 0) {
      return res.status(400).json({
        message: `${insufficient.length} 位成員PM幣餘額不足，無法開始新一期收款`,
        code: 'INSUFFICIENT_BALANCE',
        memberIds: insufficient.map(m => m.userId),
      })
    }

    const base = new Date(group.nextBillingDate ?? new Date())
    if (group.billingCycle === 'yearly') base.setFullYear(base.getFullYear() + 1)
    else base.setMonth(base.getMonth() + 1)

    // 續訂後回到跟第一次鎖定群組相同的填寫帳號資訊階段，比照設定 24h 倒數
    const serviceInfoDeadline = new Date()
    serviceInfoDeadline.setHours(serviceInfoDeadline.getHours() + 24)

    const updated = await prisma.$transaction(async (tx) => {
      // 向每位成員收取本期代管費用；用 gte 條件式扣款，避免上方檢查後、寫入前餘額被其他請求變動造成扣成負數
      const charged = await tx.user.updateMany({
        where: { id: { in: memberIds }, tokenBalance: { gte: seatCost } },
        data:  { tokenBalance: { decrement: seatCost } },
      })
      if (charged.count !== memberIds.length) {
        const err = new Error('部分成員PM幣餘額於扣款當下不足，請稍後重試')
        err.statusCode = 409
        throw err
      }

      await tx.tokenTransaction.createMany({
        data: memberIds.map(userId => ({
          userId,
          type:           'escrow',
          amount:         -seatCost,
          relatedGroupId: req.params.id,
          note:           `新一期代管 ${seatCost} PM`,
        })),
      })

      // 清空所有成員的服務帳號資訊，讓他們重新填寫
      await tx.member.updateMany({
        where: { groupId: req.params.id },
        data:  { serviceInfo: null, serviceInfoIssueNote: null, confirmedAt: null },
      })

      return tx.group.update({
        where: { id: req.params.id },
        data:  { status: 'pending_confirmation', nextBillingDate: base, serviceInfoDeadline, escrowTokens: { increment: seatCost * memberIds.length } },
        include: {
          host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
          service: true,
          _count:  { select: { members: true } },
        },
      })
    })

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
      include: { user: { select: { id: true, name: true, avatarInitial: true, avatarColor: true } } },
    })
    res.json(transactions)
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
