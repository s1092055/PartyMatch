import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { deleteAllUserSessions } from './auth.js'
import { maskAvatar } from '../lib/avatarVisibility.js'

const router = Router()

const updateProfileSchema = z.object({
  name:         z.string().min(1).max(50).optional(),
  phone:        z.union([z.literal(''), z.string().regex(/^\+[1-9]\d{6,14}$/)]).optional(),
  bio:          z.string().max(500).optional(),
  avatarColor:  z.string().optional(),
  avatarInitial: z.string().max(2).optional(),
  showAvatar:   z.boolean().optional(),
})

const deactivateSchema = z.object({
  password: z.string().min(1),
})

// GET /users/:id — 公開資料
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, creditScore: true, bio: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ message: '使用者不存在' })
    res.json(maskAvatar(user))
  } catch (err) { next(err) }
})

// PATCH /users/me
router.patch('/me', requireAuth, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where:  { id: req.user.id },
      data:   req.body,
      select: { id: true, email: true, name: true, phone: true, avatarColor: true, avatarInitial: true, showAvatar: true, creditScore: true, bio: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})

// POST /users/me/deactivate — 軟刪除帳號：需再次輸入密碼確認，停用後立即清除所有裝置的登入 session，
// 保留使用者/群組/交易等資料供日後申請恢復，不做實體刪除
router.post('/me/deactivate', requireAuth, validate(deactivateSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user || !user.passwordHash) return res.status(400).json({ message: '此帳號無法以密碼驗證停用' })

    const valid = await bcrypt.compare(req.body.password, user.passwordHash)
    if (!valid) return res.status(401).json({ message: '密碼錯誤' })

    if (user.deactivatedAt) return res.json({ message: '帳號已是停用狀態' })

    await prisma.user.update({ where: { id: user.id }, data: { deactivatedAt: new Date() } })
    await deleteAllUserSessions(user.id)

    res.json({ message: '帳號已停用' })
  } catch (err) { next(err) }
})

export default router
