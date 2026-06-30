import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const updateProfileSchema = z.object({
  name:         z.string().min(1).max(50).optional(),
  avatarColor:  z.string().optional(),
  avatarInitial: z.string().max(2).optional(),
})

// GET /users/:id — 公開資料
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ message: '使用者不存在' })
    res.json(user)
  } catch (err) { next(err) }
})

// PATCH /users/me
router.patch('/me', requireAuth, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where:  { id: req.user.id },
      data:   req.body,
      select: { id: true, email: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})

export default router
