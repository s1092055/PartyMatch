import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const updateSubscriptionSchema = z.object({
  subscriptionAccount: z.string().optional(),
  status:              z.enum(['pending', 'active', 'ended']).optional(),
  nextBillingDate:     z.string().optional(),
})

// GET /subscriptions?userId=&groupId=
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { userId, groupId } = req.query
    const subscriptions = await prisma.subscription.findMany({
      where: {
        ...(userId  && { userId }),
        ...(groupId && { groupId }),
      },
      include: {
        group: { include: { service: true, host: { select: { id: true, name: true } } } },
        user:  { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(subscriptions)
  } catch (err) { next(err) }
})

// POST /subscriptions
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId, userId } = req.body
    const sub = await prisma.subscription.create({
      data: { groupId, userId: userId ?? req.user.id },
    })
    res.status(201).json(sub)
  } catch (err) { next(err) }
})

// DELETE /subscriptions/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.subscription.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

// PATCH /subscriptions/:id — 成員標記付款 or 團主確認
router.patch('/:id', requireAuth, validate(updateSubscriptionSchema), async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { group: true },
    })
    if (!sub) return res.status(404).json({ message: '訂閱不存在' })

    const isOwner = sub.userId === req.user.id
    const isHost  = sub.group.hostId === req.user.id
    if (!isOwner && !isHost) return res.status(403).json({ message: '無操作權限' })

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data:  req.body,
    })
    res.json(updated)
  } catch (err) { next(err) }
})

export default router
