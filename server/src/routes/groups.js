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
