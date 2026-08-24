import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where:   { userId: req.user.id },
      include: { group: { include: { service: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(favorites)
  } catch (err) { next(err) }
});

router.post('/:groupId', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    const existing = await prisma.favorite.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId } },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      return res.json({ favorited: false })
    }

    await prisma.favorite.create({ data: { userId: req.user.id, groupId } })
    res.status(201).json({ favorited: true })
  } catch (err) { next(err) }
});

export default router
