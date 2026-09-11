import { randomUUID, randomBytes } from 'crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import redis from '../lib/redis.js'
import { ensureSystemConversation } from '../lib/systemUser.js'
import { notify } from './groups/shared.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter, refreshLimiter, emailVerificationLimiter, passwordResetLimiter } from '../middleware/rateLimit.js'
import { isWithinRecoveryWindow, reactivateUserAccount } from '../services/accountRecovery.service.js'
import { sendVerificationEmail, sendAccountAlreadyExistsEmail, sendPasswordResetEmail } from '../lib/mailer.js'
import { recordFailedLogin, isAccountLocked, clearFailedLogins } from '../lib/loginAttempts.js'

const EMAIL_VERIFICATION_EXPIRES_MS = 1000 * 60 * 60 * 24; // 24 小時
const PASSWORD_RESET_EXPIRES_MS     = 1000 * 60 * 60; // 1 小時

function generateSecureToken() {
  return randomBytes(32).toString('hex')
}

// 白名單挑欄位回傳給前端，取代「抓整包 user 再一個個排除敏感欄位」的寫法——
// 後者每次幫 User 新增一個敏感欄位（如這次的 emailVerificationToken/passwordResetToken）都要記得回頭補排除，
// 忘記排除就會直接外洩，白名單寫法從根本上排除這個風險
const PUBLIC_USER_FIELDS = [
  'id', 'email', 'name', 'phone', 'creditScore', 'tokenBalance',
  'avatarColor', 'avatarInitial', 'showAvatar', 'presenceStatus',
  'bio', 'mutedNotificationCategories', 'createdAt', 'emailVerified',
]

function pickSafeUser(user) {
  const safe = {}
  for (const field of PUBLIC_USER_FIELDS) safe[field] = user[field]
  return safe
}

const PUBLIC_USER_SELECT = Object.fromEntries(PUBLIC_USER_FIELDS.map(field => [field, true]))

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

const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token:       z.string().min(1),
  newPassword: z.string().min(8),
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
    if (exists) {
      sendAccountAlreadyExistsEmail(exists).catch(err => console.error('[auth] 寄送帳號已存在提醒信失敗:', err));
      return res.status(409).json({ message: '此 Email 已被註冊' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const emailVerificationToken   = generateSecureToken()
    const emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_MS)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        emailVerificationToken,
        emailVerificationExpires,
      },
      select: PUBLIC_USER_SELECT,
    })

    sendVerificationEmail(user, emailVerificationToken).catch(err => console.error('[auth] 寄送驗證信失敗:', err));
    ensureSystemConversation(user.id).catch(err => console.error('[auth] 建立系統聊天室失敗:', err));
    notify({
      userId:  user.id,
      type:    'system',
      title:   '歡迎來到 PartyMatch',
      message: '探索群組、使用條件搜尋，或直接建立自己的群組開始共享訂閱吧。',
    }).catch(err => console.error('[auth] 建立歡迎通知失敗:', err));

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
    if (await isAccountLocked(email)) {
      return res.status(429).json({ message: '登入失敗次數過多，請 15 分鐘後再試' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      await recordFailedLogin(email)
      return res.status(401).json({ message: 'Email 或密碼錯誤' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      await recordFailedLogin(email)
      return res.status(401).json({ message: 'Email 或密碼錯誤' })
    }
    await clearFailedLogins(email)

    if (user.deactivatedAt) {
      const recoverable = isWithinRecoveryWindow(user.deactivatedAt)
      return res.status(403).json({
        message: recoverable ? '此帳號已停用，是否要恢復帳號？' : '此帳號已停用超過可恢復期限，如需恢復請聯絡客服',
        code: 'ACCOUNT_DEACTIVATED',
        recoverable,
      })
    }

    ensureSystemConversation(user.id).catch(err => console.error('[auth] 確保系統聊天室失敗:', err));

    const sessionId    = randomUUID();
    const accessToken  = signAccessToken({ id: user.id, email: user.email, sessionId })
    const refreshToken = signRefreshToken({ id: user.id, sessionId })
    await saveRefreshToken(user.id, sessionId, refreshToken)

    setRefreshCookie(res, refreshToken)
    res.json({ user: pickSafeUser(user), accessToken })
  } catch (err) { next(err) }
});

router.post('/reactivate', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (await isAccountLocked(email)) {
      return res.status(429).json({ message: '登入失敗次數過多，請 15 分鐘後再試' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      await recordFailedLogin(email)
      return res.status(401).json({ message: 'Email 或密碼錯誤' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      await recordFailedLogin(email)
      return res.status(401).json({ message: 'Email 或密碼錯誤' })
    }
    await clearFailedLogins(email)

    if (!user.deactivatedAt) return res.status(400).json({ message: '帳號目前為啟用狀態，請直接登入' })
    if (!isWithinRecoveryWindow(user.deactivatedAt)) {
      return res.status(403).json({ message: '已超過可自助恢復期限，如需恢復請聯絡客服', code: 'ACCOUNT_RECOVERY_EXPIRED' })
    }

    await reactivateUserAccount(user.id)
    ensureSystemConversation(user.id).catch(err => console.error('[auth] 確保系統聊天室失敗:', err));

    const sessionId    = randomUUID();
    const accessToken  = signAccessToken({ id: user.id, email: user.email, sessionId })
    const refreshToken = signRefreshToken({ id: user.id, sessionId })
    await saveRefreshToken(user.id, sessionId, refreshToken)

    setRefreshCookie(res, refreshToken)
    res.json({ user: pickSafeUser(user), accessToken })
  } catch (err) { next(err) }
});

router.post('/verify-email', validate(verifyEmailSchema), async (req, res, next) => {
  try {
    const { token } = req.body
    const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } })
    if (!user) return res.status(400).json({ message: '驗證連結無效，請重新申請一次' })
    if (user.emailVerified) return res.json({ message: '信箱已經驗證過了' })
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ message: '驗證連結已過期，請重新申請一次', code: 'EMAIL_VERIFICATION_EXPIRED' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  { emailVerified: true, emailVerifiedAt: new Date(), emailVerificationToken: null, emailVerificationExpires: null },
    })
    res.json({ message: '信箱驗證成功' })
  } catch (err) { next(err) }
});

router.post('/resend-verification', requireAuth, emailVerificationLimiter, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return res.status(404).json({ message: '使用者不存在' })
    if (user.emailVerified) return res.status(400).json({ message: '信箱已經驗證過了' })

    const emailVerificationToken   = generateSecureToken()
    const emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_MS)
    await prisma.user.update({ where: { id: user.id }, data: { emailVerificationToken, emailVerificationExpires } })

    await sendVerificationEmail(user, emailVerificationToken)
    res.json({ message: '驗證信已重新寄出' })
  } catch (err) { next(err) }
});

router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    // 不論信箱是否存在都回傳一模一樣的訊息，避免被拿來列舉哪些信箱已經註冊
    if (user) {
      const passwordResetToken   = generateSecureToken()
      const passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS)
      await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken, passwordResetExpires } })
      sendPasswordResetEmail(user, passwordResetToken).catch(err => console.error('[auth] 寄送重設密碼信失敗:', err));
    }
    res.json({ message: '如果這個信箱有註冊帳號，會收到重設密碼的信件' })
  } catch (err) { next(err) }
});

router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { passwordResetToken: token } })
    if (!user) return res.status(400).json({ message: '重設密碼連結無效，請重新申請一次' })
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ message: '重設密碼連結已過期，請重新申請一次', code: 'PASSWORD_RESET_EXPIRED' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    })
    await clearFailedLogins(user.email)
    await deleteAllUserSessions(user.id) // 密碼重設後，強制所有裝置的舊登入狀態失效，避免舊 session 被延續使用

    res.json({ message: '密碼已重設，請使用新密碼登入' })
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
      const recoverable = isWithinRecoveryWindow(user.deactivatedAt)
      return res.status(403).json({
        message: recoverable ? '此帳號已停用，是否要恢復帳號？' : '此帳號已停用超過可恢復期限，如需恢復請聯絡客服',
        code: 'ACCOUNT_DEACTIVATED',
        recoverable,
      });
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
      select: PUBLIC_USER_SELECT,
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
