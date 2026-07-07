import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const createSchema = z.object({
  brand: z.string().min(1).max(32),
  last4: z.string().length(4).regex(/^\d{4}$/),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
})

// GET /api/payment-methods
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json(methods)
  } catch (err) {
    next(err)
  }
})

// POST /api/payment-methods
router.post('/', requireAuth, validate(createSchema), async (req, res, next) => {
  try {
    const count = await prisma.paymentMethod.count({ where: { userId: req.user.id } })
    if (count >= 2) return res.status(400).json({ message: '最多只能儲存 2 種付款方式' })

    const isFirst = count === 0
    const method = await prisma.paymentMethod.create({
      data: { ...req.body, userId: req.user.id, isDefault: isFirst },
    })
    res.status(201).json(method)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/payment-methods/:id/default
router.patch('/:id/default', requireAuth, async (req, res, next) => {
  try {
    const method = await prisma.paymentMethod.findUnique({ where: { id: req.params.id } })
    if (!method || method.userId !== req.user.id) return res.status(404).json({ message: '找不到付款方式' })

    await prisma.$transaction([
      prisma.paymentMethod.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } }),
      prisma.paymentMethod.update({ where: { id: req.params.id }, data: { isDefault: true } }),
    ])
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/payment-methods/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const method = await prisma.paymentMethod.findUnique({ where: { id: req.params.id } })
    if (!method || method.userId !== req.user.id) return res.status(404).json({ message: '找不到付款方式' })

    await prisma.paymentMethod.delete({ where: { id: req.params.id } })

    // 若刪的是預設，把剩下的第一筆設為預設
    if (method.isDefault) {
      const first = await prisma.paymentMethod.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'asc' } })
      if (first) await prisma.paymentMethod.update({ where: { id: first.id }, data: { isDefault: true } })
    }

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
