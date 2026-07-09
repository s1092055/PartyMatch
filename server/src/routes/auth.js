import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import redis from '../lib/redis.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  name:     z.string().min(1).max(50),
  phone:    z.string().regex(/^09\d{8}$/, '請輸入正確的手機號碼格式'),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

// POST /auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ message: '此 Email 已被註冊' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        avatarInitial: name[0].toUpperCase(),
        avatarColor: randomAvatarColor(),
      },
      select: { id: true, email: true, name: true, phone: true, creditScore: true, tokenBalance: true, isAdmin: true, avatarColor: true, avatarInitial: true },
    })

    const accessToken  = signAccessToken({ id: user.id, email: user.email })
    const refreshToken = signRefreshToken({ id: user.id })
    await saveRefreshToken(user.id, refreshToken)

    res.status(201).json({ user, accessToken, refreshToken })
  } catch (err) { next(err) }
})

// POST /auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Email 或密碼錯誤' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Email 或密碼錯誤' })

    const accessToken  = signAccessToken({ id: user.id, email: user.email })
    const refreshToken = signRefreshToken({ id: user.id })
    await saveRefreshToken(user.id, refreshToken)

    const { passwordHash: _, ...safeUser } = user
    res.json({ user: safeUser, accessToken, refreshToken })
  } catch (err) { next(err) }
})

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ message: '缺少 refresh token' })

    const payload = verifyRefreshToken(refreshToken)
    const stored  = await redis.get(`refresh:${payload.id}`)
    if (stored !== refreshToken) return res.status(401).json({ message: 'Refresh token 無效' })

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true },
    })
    if (!user) return res.status(401).json({ message: '使用者不存在' })

    const newAccess  = signAccessToken({ id: user.id, email: user.email })
    const newRefresh = signRefreshToken({ id: user.id })
    await saveRefreshToken(user.id, newRefresh)

    res.json({ accessToken: newAccess, refreshToken: newRefresh })
  } catch {
    res.status(401).json({ message: 'Refresh token 無效或已過期' })
  }
})

// POST /auth/logout
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await redis.del(`refresh:${req.user.id}`)
    res.json({ message: '已登出' })
  } catch (err) { next(err) }
})

// GET /auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, phone: true, creditScore: true, tokenBalance: true, isAdmin: true, avatarColor: true, avatarInitial: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ message: '使用者不存在' })
    res.json(user)
  } catch (err) { next(err) }
})

// ── Helpers ────────────────────────────────────────────────────────────────────

async function saveRefreshToken(userId, token) {
  // 7 天 = 604800 秒
  await redis.set(`refresh:${userId}`, token, 'EX', 60 * 60 * 24 * 7)
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
]

function randomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

export default router
