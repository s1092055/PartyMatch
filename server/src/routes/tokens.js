import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const topupSchema = z.object({
  amount: z.number().int().min(1).max(100000),
})

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.query
    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where:  { id: req.user.id },
        select: { tokenBalance: true },
      }),
      prisma.tokenTransaction.findMany({
        where:   groupId ? { userId: req.user.id, relatedGroupId: groupId } : { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        ...(groupId ? {} : { take: 50 }),
        include: { relatedGroup: { select: { id: true, planName: true, service: { select: { name: true } } } } },
      }),
    ])
    res.json({ tokenBalance: user.tokenBalance, transactions })
  } catch (err) { next(err) }
});

router.post('/topup', requireAuth, validate(topupSchema), async (req, res, next) => {
  try {
    const { amount } = req.body
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data:  { tokenBalance: { increment: amount } },
        select: { tokenBalance: true },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId: req.user.id,
          type:   'topup',
          amount,
          note:   `模擬儲值 ${amount} PM`,
        },
      }),
    ])
    res.json({ tokenBalance: user.tokenBalance })
  } catch (err) { next(err) }
});

export default router
