import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { maskAvatar } from '../lib/avatarVisibility.js'
import { notify } from './groups/shared.js'

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
        include: { author: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])
    res.json({ average: aggregate._avg.rating, count: aggregate._count, reviews: reviews.map(r => ({ ...r, author: maskAvatar(r.author) })) })
  } catch (err) { next(err) }
})

// POST /reviews — 成員確認服務後，對該群組團主留下評價（同一群組同一人只能有一筆，重複送出視為更新）
router.post('/', requireAuth, validate(createReviewSchema), async (req, res, next) => {
  try {
    const { groupId, rating, comment } = req.body
    const group = await prisma.group.findUnique({
      where:  { id: groupId },
      select: { id: true, hostId: true, planName: true, service: { select: { name: true } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId === req.user.id) return res.status(400).json({ message: '不能評價自己' })

    const [member, author] = await Promise.all([
      prisma.member.findUnique({ where: { groupId_userId: { groupId, userId: req.user.id } } }),
      prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } }),
    ])
    if (!member) return res.status(403).json({ message: '僅該群組成員可以留下評價' })

    const isNewReview = !(await prisma.review.findUnique({ where: { groupId_authorId: { groupId, authorId: req.user.id } } }))

    const review = await prisma.review.upsert({
      where:  { groupId_authorId: { groupId, authorId: req.user.id } },
      update: { rating, comment: comment ?? null },
      create: { groupId, hostId: group.hostId, authorId: req.user.id, rating, comment: comment ?? null },
    })

    // 修改已存在的評價不算「新收到一則」，不用重複通知團主
    if (isNewReview) {
      const groupLabel = group.planName ?? group.service?.name ?? ''
      notify({
        userId:  group.hostId,
        type:    'group_reviewed',
        title:   '收到新的評價',
        message: `${author?.name ?? '成員'} 對「${groupLabel}」留下了評價。`,
        meta:    { groupId },
      })
    }

    res.status(201).json(review)
  } catch (err) { next(err) }
})

export default router
