import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const applySchema = z.object({
  message: z.string().max(300).optional(),
})

const reviewSchema = z.object({
  action: z.enum(['approved', 'rejected']),
})

// GET /applications?groupId=&userId=
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId, userId } = req.query
    const applications = await prisma.application.findMany({
      where: {
        ...(groupId && { groupId }),
        ...(userId  && { userId }),
      },
      include: {
        user:  { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
        group: { select: { id: true, planName: true, service: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(applications)
  } catch (err) { next(err) }
})

// POST /applications — 送出申請
router.post('/', requireAuth, validate(applySchema), async (req, res, next) => {
  try {
    const { groupId, message } = req.body
    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'recruiting') return res.status(400).json({ message: '此群組目前不開放申請' })
    if (group.hostId === req.user.id) return res.status(400).json({ message: '團主不能申請自己的群組' })

    const existing = await prisma.application.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
    })
    if (existing) return res.status(409).json({ message: '你已申請過此群組' })

    const application = await prisma.application.create({
      data: { groupId, userId: req.user.id, message },
    })
    res.status(201).json(application)
  } catch (err) { next(err) }
})

// PATCH /applications/:id — 團主審核
router.patch('/:id', requireAuth, validate(reviewSchema), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { group: true },
    })
    if (!application) return res.status(404).json({ message: '申請不存在' })
    if (application.group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可審核' })

    const { action } = req.body
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data:  { status: action },
    })

    if (action === 'approved') {
      // 建立 member + subscription
      await prisma.$transaction([
        prisma.member.create({
          data: { groupId: application.groupId, userId: application.userId },
        }),
        prisma.subscription.create({
          data: { groupId: application.groupId, userId: application.userId },
        }),
        prisma.group.update({
          where: { id: application.groupId },
          data:  { currentMembers: { increment: 1 } },
        }),
      ])
    }

    res.json(updated)
  } catch (err) { next(err) }
})

export default router
