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
