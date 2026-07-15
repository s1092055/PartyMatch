import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { getSystemUserId, sendSystemMessageToUser } from '../lib/systemUser.js'

const router = Router()

const broadcastSchema = z.object({
  content: z.string().min(1).max(2000),
})

const directSchema = z.object({
  userId:  z.string().min(1),
  content: z.string().min(1).max(2000),
})

// POST /system-messages/broadcast — 管理員對全平台使用者的系統聊天室發送同一則訊息
router.post('/broadcast', requireAdmin, validate(broadcastSchema), async (req, res, next) => {
  try {
    const { content } = req.body
    const senderId = await getSystemUserId()

    const users = await prisma.user.findMany({ where: { id: { not: senderId } }, select: { id: true } })
    let sent = 0
    for (const user of users) {
      await sendSystemMessageToUser(user.id, content)
      sent += 1
    }

    res.status(201).json({ sent })
  } catch (err) { next(err) }
})

// POST /system-messages/direct — 管理員對單一使用者的系統聊天室發送訊息
router.post('/direct', requireAdmin, validate(directSchema), async (req, res, next) => {
  try {
    const { userId, content } = req.body
    await sendSystemMessageToUser(userId, content)

    res.status(201).json({ sent: 1 })
  } catch (err) { next(err) }
})

export default router
