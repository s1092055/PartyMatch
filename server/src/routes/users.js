import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { deleteAllUserSessions, clearRefreshCookie } from './auth.js'
import { maskAvatar } from '../lib/avatarVisibility.js'

const router = Router()

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const email = req.query.email?.trim()
    if (!email) return res.status(400).json({ message: '請提供 email' })

    const user = await prisma.user.findUnique({
      where:  { email },
      select: { id: true, name: true, email: true },
    })
    if (!user) return res.status(404).json({ message: '查無此使用者' })
    res.json(user)
  } catch (err) { next(err) }
});

const updateProfileSchema = z.object({
  name:         z.string().min(1).max(50).optional(),
  phone:        z.union([z.literal(''), z.string().regex(/^\+[1-9]\d{6,14}$/)]).optional(),
  bio:          z.string().max(500).optional(),
  avatarColor:  z.string().optional(),
  avatarInitial: z.string().max(2).optional(),
  showAvatar:   z.boolean().optional(),
  presenceStatus: z.enum(['online', 'busy', 'offline']).optional(),
})

const deactivateSchema = z.object({
  password: z.string().min(1),
})

router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ message: '使用者不存在' })
    res.json(maskAvatar(user))
  } catch (err) { next(err) }
});

router.patch('/me', requireAuth, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where:  { id: req.user.id },
      data:   req.body,
      select: { id: true, email: true, name: true, phone: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true },
    })
    res.json(user)
  } catch (err) { next(err) }
});

router.get('/me/credit-history', requireAuth, async (req, res, next) => {
  try {
    const [user, logs] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id }, select: { creditScore: true } }),
      prisma.creditScoreLog.findMany({
        where:   { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take:    50,
        include: { relatedGroup: { select: { id: true, planName: true, service: { select: { name: true } } } } },
      }),
    ])
    res.json({ creditScore: user?.creditScore ?? null, logs })
  } catch (err) { next(err) }
});

router.post('/me/deactivate', requireAuth, validate(deactivateSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user || !user.passwordHash) return res.status(400).json({ message: '此帳號無法以密碼驗證停用' })

    const valid = await bcrypt.compare(req.body.password, user.passwordHash)
    if (!valid) return res.status(401).json({ message: '密碼錯誤' })

    if (user.deactivatedAt) return res.json({ message: '帳號已是停用狀態' })

    await prisma.user.update({ where: { id: user.id }, data: { deactivatedAt: new Date() } })
    await deleteAllUserSessions(user.id)
    clearRefreshCookie(res)

    res.json({ message: '帳號已停用' })
  } catch (err) { next(err) }
});

export default router
