import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /payments?subscriptionId=
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { subscriptionId } = req.query
    const payments = await prisma.paymentRecord.findMany({
      where: subscriptionId ? { subscriptionId } : { subscription: { userId: req.user.id } },
      orderBy: { paidAt: 'desc' },
    })
    res.json(payments)
  } catch (err) { next(err) }
})

// POST /payments
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { subscriptionId, amount, periodLabel, proofUrl } = req.body
    const payment = await prisma.paymentRecord.create({
      data: { subscriptionId, amount, periodLabel, proofUrl },
    })
    res.status(201).json(payment)
  } catch (err) { next(err) }
})

export default router
