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

// GET /members — 回傳與目前用戶相關的成員（所在群組所有成員 + 所主持群組的成員）
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.query
    let where
    if (groupId) {
      where = { groupId }
    } else {
      // 先找出用戶加入的所有 groupId，再一次撈這些群組的全部成員
      const myMemberships = await prisma.member.findMany({
        where:  { userId: req.user.id },
        select: { groupId: true },
      })
      const myGroupIds = myMemberships.map(m => m.groupId)
      where = {
        OR: [
          { groupId: { in: myGroupIds } },       // 我所在群組的所有成員
          { group: { hostId: req.user.id } },    // 我主持的群組的成員
        ],
      }
    }
    const members = await prisma.member.findMany({
      where,
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

// DELETE /members/:id — 團主可移除成員；成員本人可退出群組
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { group: { select: { hostId: true, status: true } } },
    })
    if (!existing) return res.status(404).json({ message: '成員不存在' })

    const isHost   = existing.group.hostId === req.user.id
    const isSelf   = existing.userId === req.user.id
    if (!isHost && !isSelf) return res.status(403).json({ message: '無操作權限' })

    // 成員只能在 recruiting / full 階段退出（付款階段不允許）
    if (isSelf && !isHost && !['recruiting', 'full'].includes(existing.group.status)) {
      return res.status(400).json({ message: '付款確認階段無法退出群組' })
    }

    const newCount = await prisma.$transaction(async (tx) => {
      await tx.member.delete({ where: { id: req.params.id } })
      const updated = await tx.group.update({
        where: { id: existing.groupId },
        data:  {
          currentMembers: { decrement: 1 },
          // 若群組在 full 狀態有人退出，退回 recruiting
          ...(existing.group.status === 'full' ? { status: 'recruiting' } : {}),
        },
        select: { currentMembers: true },
      })
      // 成員自行退出：把 application 標為 removed，讓成員可重新申請
      if (isSelf && !isHost) {
        await tx.application.updateMany({
          where: { groupId: existing.groupId, applicantId: existing.userId, status: 'approved' },
          data:  { status: 'removed' },
        })
      }
      return updated.currentMembers
    })

    res.status(200).json({ currentMembers: newCount })
  } catch (err) { next(err) }
})

export default router
