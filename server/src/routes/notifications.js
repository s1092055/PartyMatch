import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router()

// GET /notifications — 個人通知 + 系統公告
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const where = req.user
      ? { OR: [{ userId: req.user.id }, { isPublic: true }] }
      : { isPublic: true }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(notifications)
  } catch (err) { next(err) }
})

// POST /notifications — 建立通知（內部服務或系統管理用）
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { userId, type, title, body, link, isPublic } = req.body
    const notif = await prisma.notification.create({
      data: { userId, type, title, body, link, isPublic: isPublic ?? false },
    })
    res.status(201).json(notif)
  } catch (err) { next(err) }
})

// PATCH /notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } })
    if (!notif) return res.status(404).json({ message: '通知不存在' })
    if (notif.userId !== req.user.id) return res.status(403).json({ message: '無操作權限' })

    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// PATCH /notifications/read-all
router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
