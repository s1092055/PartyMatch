import { verifyAccessToken, verifyAdminAccessToken } from '../utils/jwt.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未授權，請先登入' })
  }

  const token = header.slice(7)
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ message: 'Token 無效或已過期' })
  }
}

// 管理員驗證跟一般使用者的 requireAuth 完全分開：用獨立的 JWT_ADMIN_ACCESS_SECRET 驗證，
// 一般使用者的 access token 無論如何都不會通過這裡（反之亦然）
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未授權，請先登入' })
  }

  const token = header.slice(7)
  try {
    req.admin = verifyAdminAccessToken(token)
    next()
  } catch {
    res.status(401).json({ message: 'Token 無效或已過期' })
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7))
    } catch {}
  }
  next()
}
