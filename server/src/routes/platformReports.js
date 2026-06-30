import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const createReportSchema = z.object({
  groupId:     z.string().min(1),
  description: z.string().min(1).max(1000),
  evidenceUrl: z.string().optional(),
})

router.post('/', requireAuth, validate(createReportSchema), async (req, res, next) => {
  try {
    const { groupId, description, evidenceUrl } = req.body

    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true, hostId: true } })
    if (!group) return res.status(404).json({ message: '群組不存在' })

    const isHost   = group.hostId === req.user.id
    const isMember = isHost ? false : !!(await prisma.member.findFirst({ where: { groupId, userId: req.user.id } }))
    if (!isHost && !isMember) return res.status(403).json({ message: '僅群組團主或成員可回報問題' })

    const report = await prisma.platformReport.create({
      data: {
        groupId,
        reporterId: req.user.id,
        description,
        evidenceUrl: evidenceUrl || null,
      },
    })
    res.status(201).json(report)
  } catch (err) { next(err) }
});

export default router
