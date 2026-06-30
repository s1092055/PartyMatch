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
  paidAmount:          z.number().optional(),
  lastPaidAt:          z.string().optional(),
  serviceInfo:         z.any().optional(),
  serviceInfoIssueNote: z.string().nullable().optional(),
  paymentIssueType:    z.string().nullable().optional(),
  paymentIssueNote:    z.string().nullable().optional(),
})

// GET /members — 回傳與目前用戶相關的成員（所在群組 or 所主持群組的成員）
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.query
    const members = await prisma.member.findMany({
      where: {
        ...(groupId
          ? { groupId }
          : {
              OR: [
                { userId: req.user.id },
                { group: { hostId: req.user.id } },
              ],
            }
        ),
      },
      include: {
        user: { select: { id: true, name: true, avatarColor: true, avatarInitial: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
    res.json(members)
  } catch (err) { next(err) }
})

// POST /members — 僅團主可手動加入成員（一般由申請核准流程自動建立）
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId, userId } = req.body
    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })

    const member = await prisma.member.create({
      data: { groupId, userId },
    })
    res.status(201).json(member)
  } catch (err) { next(err) }
})

// PATCH /members/:id — 成員本人或團主可更新
router.patch('/:id', requireAuth, validate(patchMemberSchema), async (req, res, next) => {
  try {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { group: { select: { hostId: true } } },
    })
    if (!existing) return res.status(404).json({ message: '成員不存在' })

    const isOwner = existing.userId === req.user.id
    const isHost  = existing.group.hostId === req.user.id
    if (!isOwner && !isHost) return res.status(403).json({ message: '無操作權限' })

    const member = await prisma.member.update({
      where: { id: req.params.id },
      data:  req.body,
    })
    res.json(member)
  } catch (err) { next(err) }
})

// DELETE /members/:id — 僅團主可移除成員
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { group: { select: { hostId: true } } },
    })
    if (!existing) return res.status(404).json({ message: '成員不存在' })
    if (existing.group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可移除成員' })

    await prisma.$transaction([
      prisma.member.delete({ where: { id: req.params.id } }),
      prisma.group.update({
        where: { id: existing.groupId },
        data:  { currentMembers: { decrement: 1 } },
      }),
    ])
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
