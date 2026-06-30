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

router.post('/broadcast', requireAdmin, validate(broadcastSchema), async (req, res, next) => {
  try {
    const { content } = req.body
    const senderId = await getSystemUserId()

    const users = await prisma.user.findMany({ where: { id: { not: senderId } }, select: { id: true } })
    const results = await Promise.allSettled(users.map(user => sendSystemMessageToUser(user.id, content)));
    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - sent
    if (failed > 0) console.error(`[system-messages] 廣播部分失敗：${failed}/${results.length}`)

    res.status(201).json({ sent })
  } catch (err) { next(err) }
});

router.post('/direct', requireAdmin, validate(directSchema), async (req, res, next) => {
  try {
    const { userId, content } = req.body
    await sendSystemMessageToUser(userId, content)

    res.status(201).json({ sent: 1 })
  } catch (err) { next(err) }
});

export default router
