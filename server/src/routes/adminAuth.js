import { randomUUID } from 'crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import redis from '../lib/redis.js'
import { signAdminAccessToken, signAdminRefreshToken, verifyAdminRefreshToken } from '../utils/jwt.js'
import { validate } from '../middleware/validate.js'
import { requireAdmin } from '../middleware/auth.js'
import { adminAuthLimiter } from '../middleware/rateLimit.js'

// 管理員帳號沒有對外開放的註冊端點，只能用 scripts/manageAdmin.js 建立/重設密碼；
// refresh cookie 用獨立的名稱跟 path，瀏覽器不會把它一起送去一般使用者的 /api/auth/refresh，
// Redis session key 也用獨立命名空間，跟一般使用者的 session 完全不共用
const router = Router()

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const REFRESH_COOKIE_NAME    = 'pm_admin_refresh_token';
const REFRESH_COOKIE_PATH    = '/api/admin/auth'
const REFRESH_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24;

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     REFRESH_COOKIE_PATH,
    maxAge:   REFRESH_COOKIE_MAX_AGE,
  })
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH })
}

function sessionRefreshKey(adminId, sessionId) {
  return `admin-refresh:${adminId}:${sessionId}`
}

async function saveRefreshToken(adminId, sessionId, token) {
  await redis.set(sessionRefreshKey(adminId, sessionId), token, 'EX', 60 * 60 * 24);
}

router.post('/login', adminAuthLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body
    const admin = await prisma.adminUser.findUnique({ where: { email } })
    if (!admin) return res.status(401).json({ message: 'Email 或密碼錯誤' })

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Email 或密碼錯誤' })

    const sessionId    = randomUUID();
    const accessToken  = signAdminAccessToken({ id: admin.id, email: admin.email, sessionId })
    const refreshToken = signAdminRefreshToken({ id: admin.id, sessionId })
    await saveRefreshToken(admin.id, sessionId, refreshToken)

    setRefreshCookie(res, refreshToken)
    res.json({ admin: { id: admin.id, email: admin.email, name: admin.name }, accessToken })
  } catch (err) { next(err) }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]
    if (!refreshToken) return res.status(401).json({ message: '缺少 refresh token' })

    const payload = verifyAdminRefreshToken(refreshToken)
    const stored = await redis.get(sessionRefreshKey(payload.id, payload.sessionId))
    if (stored !== refreshToken) return res.status(401).json({ message: 'Refresh token 無效' })

    const admin = await prisma.adminUser.findUnique({ where: { id: payload.id }, select: { id: true, email: true } })
    if (!admin) return res.status(401).json({ message: '管理員帳號不存在' })

    const newAccess  = signAdminAccessToken({ id: admin.id, email: admin.email, sessionId: payload.sessionId })
    const newRefresh = signAdminRefreshToken({ id: admin.id, sessionId: payload.sessionId })
    await saveRefreshToken(admin.id, payload.sessionId, newRefresh)

    setRefreshCookie(res, newRefresh)
    res.json({ accessToken: newAccess })
  } catch {
    res.status(401).json({ message: 'Refresh token 無效或已過期' })
  }
});

router.post('/logout', requireAdmin, async (req, res, next) => {
  try {
    await redis.del(sessionRefreshKey(req.admin.id, req.admin.sessionId))
    clearRefreshCookie(res)
    res.json({ message: '已登出' })
  } catch (err) { next(err) }
});

router.get('/me', requireAdmin, async (req, res, next) => {
  try {
    const admin = await prisma.adminUser.findUnique({
      where:  { id: req.admin.id },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    if (!admin) return res.status(404).json({ message: '管理員帳號不存在' })
    res.json(admin)
  } catch (err) { next(err) }
});

export default router
