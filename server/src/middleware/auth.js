import { verifyAccessToken } from '../utils/jwt.js'
import prisma from '../lib/prisma.js'

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

export function requireAdmin(req, res, next) {
  requireAuth(req, res, async () => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isAdmin: true } })
    if (!user?.isAdmin) return res.status(403).json({ message: '需要管理員權限' })
    next()
  })
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
