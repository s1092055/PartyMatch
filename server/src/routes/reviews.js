import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const createReviewSchema = z.object({
  groupId: z.string().min(1),
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

// GET /reviews/host/:hostId — 某位使用者作為團主的整體評價（跨所有群組彙總，公開）
router.get('/host/:hostId', async (req, res, next) => {
  try {
    const { hostId } = req.params
    const [aggregate, reviews] = await Promise.all([
      prisma.review.aggregate({ where: { hostId }, _avg: { rating: true }, _count: true }),
      prisma.review.findMany({
        where:   { hostId },
        include: { author: { select: { id: true, name: true, avatarColor: true, avatarInitial: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])
    res.json({ average: aggregate._avg.rating, count: aggregate._count, reviews })
  } catch (err) { next(err) }
})

// POST /reviews — 成員確認服務後，對該群組團主留下評價（同一群組同一人只能有一筆，重複送出視為更新）
router.post('/', requireAuth, validate(createReviewSchema), async (req, res, next) => {
  try {
    const { groupId, rating, comment } = req.body
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true, hostId: true } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId === req.user.id) return res.status(400).json({ message: '不能評價自己' })

    const member = await prisma.member.findUnique({ where: { groupId_userId: { groupId, userId: req.user.id } } })
    if (!member) return res.status(403).json({ message: '僅該群組成員可以留下評價' })

    const review = await prisma.review.upsert({
      where:  { groupId_authorId: { groupId, authorId: req.user.id } },
      update: { rating, comment: comment ?? null },
      create: { groupId, hostId: group.hostId, authorId: req.user.id, rating, comment: comment ?? null },
    })
    res.status(201).json(review)
  } catch (err) { next(err) }
})

export default router
