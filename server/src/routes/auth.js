import { randomUUID } from 'crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import redis from '../lib/redis.js'
import { ensureSystemConversation } from '../lib/systemUser.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter, refreshLimiter } from '../middleware/rateLimit.js'

const router = Router()

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  name:     z.string().min(1).max(50),
  phone:    z.string().regex(/^\+[1-9]\d{6,14}$/, '請輸入正確的手機號碼格式'),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const REFRESH_COOKIE_NAME    = 'pm_refresh_token';
const REFRESH_COOKIE_PATH    = '/api/auth'
const REFRESH_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     REFRESH_COOKIE_PATH,
    maxAge:   REFRESH_COOKIE_MAX_AGE,
  })
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH })
}

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
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
      },
      select: { id: true, email: true, name: true, phone: true, creditScore: true, tokenBalance: true, isAdmin: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, bio: true, mutedNotificationCategories: true },
    })

    ensureSystemConversation(user.id).catch(err => console.error('[auth] 建立系統聊天室失敗:', err));

    const sessionId    = randomUUID();
    const accessToken  = signAccessToken({ id: user.id, email: user.email, sessionId })
    const refreshToken = signRefreshToken({ id: user.id, sessionId })
    await saveRefreshToken(user.id, sessionId, refreshToken)

    setRefreshCookie(res, refreshToken)
    res.status(201).json({ user, accessToken })
  } catch (err) { next(err) }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Email 或密碼錯誤' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Email 或密碼錯誤' })

    if (user.deactivatedAt) {
      return res.status(403).json({ message: '此帳號已停用，如需恢復請聯絡客服', code: 'ACCOUNT_DEACTIVATED' })
    }

    ensureSystemConversation(user.id).catch(err => console.error('[auth] 確保系統聊天室失敗:', err));

    const sessionId    = randomUUID();
    const accessToken  = signAccessToken({ id: user.id, email: user.email, sessionId })
    const refreshToken = signRefreshToken({ id: user.id, sessionId })
    await saveRefreshToken(user.id, sessionId, refreshToken)

    const { passwordHash: _, ...safeUser } = user
    setRefreshCookie(res, refreshToken)
    res.json({ user: safeUser, accessToken })
  } catch (err) { next(err) }
});

router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]
    if (!refreshToken) return res.status(401).json({ message: '缺少 refresh token' })

    const payload = verifyRefreshToken(refreshToken)
    const isLegacyToken = !payload.sessionId;
    const stored = await redis.get(sessionRefreshKey(payload.id, payload.sessionId))
    if (stored !== refreshToken) return res.status(401).json({ message: 'Refresh token 無效' })

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, deactivatedAt: true },
    })
    if (!user) return res.status(401).json({ message: '使用者不存在' })
    if (user.deactivatedAt) {
      return res.status(403).json({ message: '此帳號已停用，如需恢復請聯絡客服', code: 'ACCOUNT_DEACTIVATED' });
    }

    const sessionId  = payload.sessionId ?? randomUUID();
    const newAccess  = signAccessToken({ id: user.id, email: user.email, sessionId })
    const newRefresh = signRefreshToken({ id: user.id, sessionId })
    await saveRefreshToken(user.id, sessionId, newRefresh)
    if (isLegacyToken) await redis.del(sessionRefreshKey(user.id, null))

    setRefreshCookie(res, newRefresh)
    res.json({ accessToken: newAccess })
  } catch {
    res.status(401).json({ message: 'Refresh token 無效或已過期' })
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await redis.del(sessionRefreshKey(req.user.id, req.user.sessionId))
    clearRefreshCookie(res)
    res.json({ message: '已登出' })
  } catch (err) { next(err) }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, phone: true, creditScore: true, tokenBalance: true, isAdmin: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, bio: true, mutedNotificationCategories: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ message: '使用者不存在' })
    res.json(user)
  } catch (err) { next(err) }
});

function sessionRefreshKey(userId, sessionId) {
  return sessionId ? `refresh:${userId}:${sessionId}` : `refresh:${userId}`
}

async function saveRefreshToken(userId, sessionId, token) {
  await redis.set(sessionRefreshKey(userId, sessionId), token, 'EX', 60 * 60 * 24 * 7);
}

export async function deleteAllUserSessions(userId) {
  const keys = []
  let cursor = '0'
  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', `refresh:${userId}:*`, 'COUNT', 100)
    cursor = nextCursor
    keys.push(...batch)
  } while (cursor !== '0')
  keys.push(sessionRefreshKey(userId, null));
  if (keys.length > 0) await redis.del(keys)
}

export default router
