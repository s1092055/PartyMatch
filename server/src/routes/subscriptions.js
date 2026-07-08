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

// GET /subscriptions?groupId= — 回傳自己的訂閱，或自己主持群組內的所有訂閱
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.query
    const scope = {
      OR: [
        { userId: req.user.id },
        { group: { hostId: req.user.id } },
      ],
    }
    const subscriptions = await prisma.subscription.findMany({
      where: groupId ? { AND: [scope, { groupId }] } : scope,
      include: {
        group: { include: { service: true, host: { select: { id: true, name: true } } } },
        user:  { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(subscriptions)
  } catch (err) { next(err) }
})

// DELETE /subscriptions/:id — 訂閱本人或該群組團主可刪除
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where:   { id: req.params.id },
      include: { group: { select: { hostId: true } } },
    })
    if (!sub) return res.status(404).json({ message: '訂閱不存在' })

    const isOwner = sub.userId === req.user.id
    const isHost  = sub.group.hostId === req.user.id
    if (!isOwner && !isHost) return res.status(403).json({ message: '無操作權限' })

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
