import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const patchMemberSchema = z.object({
  paymentStatus:       z.string().optional(),
  subscriptionAccount: z.string().optional(),
  paymentProofUrl:     z.string().optional(),
  lastPaidAt:          z.string().optional(),
})

// GET /members?groupId=&userId=
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId, userId } = req.query
    const members = await prisma.member.findMany({
      where: {
        ...(groupId && { groupId }),
        ...(userId  && { userId }),
      },
      include: {
        user: { select: { id: true, name: true, avatarColor: true, avatarInitial: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
    res.json(members)
  } catch (err) { next(err) }
})

// POST /members
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId, userId } = req.body
    const member = await prisma.member.create({
      data: { groupId, userId },
    })
    res.status(201).json(member)
  } catch (err) { next(err) }
})

// PATCH /members/:id
router.patch('/:id', requireAuth, validate(patchMemberSchema), async (req, res, next) => {
  try {
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data:  req.body,
    })
    res.json(member)
  } catch (err) { next(err) }
})

// DELETE /members/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.member.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
