import { verifyAccessToken, verifyAdminAccessToken } from '../utils/jwt.js'

function extractBearerToken(req) {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

export function requireAuth(req, res, next) {
  const token = extractBearerToken(req)
  if (!token) {
    return res.status(401).json({ message: '未授權，請先登入' })
  }

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
  const token = extractBearerToken(req)
  if (!token) {
    return res.status(401).json({ message: '未授權，請先登入' })
  }

  try {
    req.admin = verifyAdminAccessToken(token)
    next()
  } catch {
    res.status(401).json({ message: 'Token 無效或已過期' })
  }
}

export function optionalAuth(req, res, next) {
  const token = extractBearerToken(req)
  if (token) {
    try {
      req.user = verifyAccessToken(token)
    } catch {}
  }
  next()
}
