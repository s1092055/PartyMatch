import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router()

// 檢查 userId 是否與 groupId 有關聯（曾為成員、曾送出申請、或為團主）
// Application 紀錄只會變更狀態、不會被刪除，因此即使成員已退出/被移除仍可通過檢查
async function hasGroupRelationship(userId, groupId) {
  const [member, application, group] = await Promise.all([
    prisma.member.findFirst({ where: { groupId, userId } }),
    prisma.application.findFirst({ where: { groupId, userId } }),
    prisma.group.findFirst({ where: { id: groupId, hostId: userId } }),
  ])
  return Boolean(member || application || group)
}

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

// POST /notifications — 建立通知；通知他人時須與目標 userId 同屬一個群組（成員/團主/申請人）
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { userId, type, title, message, body, meta } = req.body
    if (!userId) return res.status(400).json({ message: '缺少通知對象' })

    if (userId !== req.user.id) {
      const groupId = meta?.groupId
      if (!groupId) return res.status(403).json({ message: '無權限建立此通知' })
      const [requesterOk, targetOk] = await Promise.all([
        hasGroupRelationship(req.user.id, groupId),
        hasGroupRelationship(userId, groupId),
      ])
      if (!requesterOk || !targetOk) return res.status(403).json({ message: '無權限建立此通知' })
    }

    const notif = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message: message ?? body ?? '',
        meta:    meta ?? undefined,
        isPublic: false, // 公開系統公告一律由後端管理流程建立，一般使用者不可指定
      },
    })
    res.status(201).json(notif)
  } catch (err) { next(err) }
})

// PATCH /notifications/read-all — 必須在 /:id/read 前面，否則會被攔截
router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true },
    })
    res.json({ success: true })
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

export default router
