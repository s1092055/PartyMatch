import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

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
  minCreditScore: z.number().int().min(0).default(0),
  minGroupAge:    z.number().int().min(0).default(0),
  billingCycle:   z.enum(['monthly', 'yearly']).optional(),
}).transform(data => ({
  ...data,
  maxMembers:  data.maxMembers  ?? data.totalSeats  ?? 6,
  monthlyFee:  data.monthlyFee  ?? data.pricePerSeat ?? 0,
  planId:      data.planId      ?? data.planName,
  rules:       Array.isArray(data.rules) ? data.rules.join('\n') : (data.rules ?? ''),
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
        ...(q && {
          OR: [
            { service: { name: { contains: q, mode: 'insensitive' } } },
            { planName:  { contains: q, mode: 'insensitive' } },
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
    res.json(group)
  } catch (err) { next(err) }
})

// POST /groups
router.post('/', requireAuth, validate(createGroupSchema), async (req, res, next) => {
  try {
    // 過濾前端送來的非資料庫欄位，只留 Prisma schema 接受的欄位
    const allowed = ['serviceId','planId','planName','maxMembers','monthlyFee','currency','rules','minCreditScore','minGroupAge','billingCycle']
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
  pending_confirmation: ['pending_activation', 'cancelled'],
  pending_activation:   ['active', 'cancelled'],
  active:               ['confirming', 'ended', 'pending_confirmation'],
  confirming:           ['active', 'disputed', 'cancelled'],
  disputed:             ['confirming', 'cancelled', 'ended'],
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
      return res.json({ group: updated, released: true })
    }

    res.json({ group: null, released: false })
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

    const cancellable = ['recruiting', 'full', 'pending_confirmation', 'pending_activation']
    if (!cancellable.includes(group.status)) {
      return res.status(400).json({ message: `群組狀態為 ${group.status}，無法解散` })
    }

    // 計算每位成員的退款金額（席位費用）
    const seatCost = group.billingCycle === 'yearly'
      ? Math.round(group.monthlyFee * 12)
      : Math.round(group.monthlyFee)

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

    // 更新群組狀態 + 所有成員訂閱的 nextBillingDate
    const [updated] = await prisma.$transaction([
      prisma.group.update({
        where: { id: req.params.id },
        data: { status: 'pending_confirmation' },
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

// DELETE /groups/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })

    await prisma.group.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
