import { randomUUID } from 'crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import redis from '../lib/redis.js'
import { randomAvatarColor } from '../utils/avatarColor.js'
import { ensureSystemConversation } from '../lib/systemUser.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'

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
      select: { id: true, email: true, name: true, phone: true, creditScore: true, tokenBalance: true, isAdmin: true, avatarColor: true, avatarInitial: true, bio: true },
    })

    // 系統聊天室建立失敗不應阻擋註冊流程
    ensureSystemConversation(user.id).catch(err => console.error('[auth] 建立系統聊天室失敗:', err))

    // sessionId 讓同一帳號能在多裝置分別維護各自的 refresh token，不會互相覆蓋踢出
    const sessionId    = randomUUID()
    const accessToken  = signAccessToken({ id: user.id, email: user.email, sessionId })
    const refreshToken = signRefreshToken({ id: user.id, sessionId })
    await saveRefreshToken(user.id, sessionId, refreshToken)

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

    if (user.deactivatedAt) {
      return res.status(403).json({ message: '此帳號已停用，如需恢復請聯絡客服', code: 'ACCOUNT_DEACTIVATED' })
    }

    // 系統聊天室若因故被清空（例如測試環境清過資料），登入時補回來，不必重新註冊帳號
    ensureSystemConversation(user.id).catch(err => console.error('[auth] 確保系統聊天室失敗:', err))

    // sessionId 讓同一帳號能在多裝置分別維護各自的 refresh token，不會互相覆蓋踢出
    const sessionId    = randomUUID()
    const accessToken  = signAccessToken({ id: user.id, email: user.email, sessionId })
    const refreshToken = signRefreshToken({ id: user.id, sessionId })
    await saveRefreshToken(user.id, sessionId, refreshToken)

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
    // 改版前簽發、payload 沒有 sessionId 的 token，查舊版沒有 session 後綴的 key；
    // 找不到才視為無效，讓這批舊 token 過期前仍能正常運作，不必強制所有人重新登入
    const isLegacyToken = !payload.sessionId
    const stored = await redis.get(sessionRefreshKey(payload.id, payload.sessionId))
    if (stored !== refreshToken) return res.status(401).json({ message: 'Refresh token 無效' })

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, deactivatedAt: true },
    })
    if (!user) return res.status(401).json({ message: '使用者不存在' })
    if (user.deactivatedAt) {
      // 帳號停用當下已清過所有 session，這裡是保險判斷（例如清除時 Redis 短暫失聯）
      return res.status(403).json({ message: '此帳號已停用，如需恢復請聯絡客服', code: 'ACCOUNT_DEACTIVATED' })
    }

    // rotate 時延用同一個 sessionId 代表同一台裝置的續期；舊 token 沒有 sessionId，
    // 藉這次 refresh 順便升級成新機制，並清掉舊版沒有 session 後綴的 key
    const sessionId  = payload.sessionId ?? randomUUID()
    const newAccess  = signAccessToken({ id: user.id, email: user.email, sessionId })
    const newRefresh = signRefreshToken({ id: user.id, sessionId })
    await saveRefreshToken(user.id, sessionId, newRefresh)
    if (isLegacyToken) await redis.del(sessionRefreshKey(user.id, null))

    res.json({ accessToken: newAccess, refreshToken: newRefresh })
  } catch {
    res.status(401).json({ message: 'Refresh token 無效或已過期' })
  }
})

// POST /auth/logout — 只登出目前這台裝置的 session，其他裝置的登入狀態不受影響
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await redis.del(sessionRefreshKey(req.user.id, req.user.sessionId))
    res.json({ message: '已登出' })
  } catch (err) { next(err) }
})

// GET /auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, phone: true, creditScore: true, tokenBalance: true, isAdmin: true, avatarColor: true, avatarInitial: true, bio: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ message: '使用者不存在' })
    res.json(user)
  } catch (err) { next(err) }
})

// ── Helpers ────────────────────────────────────────────────────────────────────

// 改版前簽發的 token 沒有 sessionId，統一在這裡處理新舊兩種 key 格式，
// 避免 /refresh、/logout、deleteAllUserSessions 各自重新判斷一次
function sessionRefreshKey(userId, sessionId) {
  return sessionId ? `refresh:${userId}:${sessionId}` : `refresh:${userId}`
}

async function saveRefreshToken(userId, sessionId, token) {
  // 7 天 = 604800 秒；key 帶 sessionId，讓同一使用者可以同時有多台裝置各自的 refresh token
  await redis.set(sessionRefreshKey(userId, sessionId), token, 'EX', 60 * 60 * 24 * 7)
}

// 停用帳號等場景需要立即讓「所有裝置」的登入失效，掃描該使用者的全部 session key 一次刪除
// 用 SCAN 而非 KEYS，避免阻塞整個 Redis（KEYS 是 O(N) 全 keyspace 遍歷）
export async function deleteAllUserSessions(userId) {
  const keys = []
  let cursor = '0'
  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', `refresh:${userId}:*`, 'COUNT', 100)
    cursor = nextCursor
    keys.push(...batch)
  } while (cursor !== '0')
  keys.push(sessionRefreshKey(userId, null)) // 相容改版前沒有 session 後綴的舊 key
  if (keys.length > 0) await redis.del(keys)
}

export default router
