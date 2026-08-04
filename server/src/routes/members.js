import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { computeSeatCost } from '../utils/pricing.js'
import { admitMemberIntoGroup, refundEscrow } from '../utils/membership.js'
import { maskAvatar } from '../lib/avatarVisibility.js'

const router = Router()

const addMemberSchema = z.object({
  groupId: z.string().min(1),
  userId:  z.string().min(1),
})

const patchMemberSchema = z.object({
  serviceInfo:                 z.any().optional(),
  serviceInfoIssueNote:        z.string().nullable().optional(),
  serviceInfoIssueEvidenceUrl: z.string().nullable().optional(),
})

// GET /members — 回傳與目前用戶相關的成員（所在群組所有成員 + 所主持群組的成員）
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.query
    let where
    if (groupId) {
      // 指定 groupId 時，需先確認請求人是該群組成員或團主
      const isMember = await prisma.member.findFirst({ where: { groupId, userId: req.user.id } })
      const isHost   = isMember ? null : await prisma.group.findFirst({ where: { id: groupId, hostId: req.user.id } })
      if (!isMember && !isHost) return res.status(403).json({ message: '無權限查看此群組成員' })
      where = { groupId }
    } else {
      where = {
        OR: [
          { group: { members: { some: { userId: req.user.id } } } }, // 我所在群組的所有成員
          { group: { hostId: req.user.id } },                        // 我主持的群組的成員
        ],
      }
    }
    const members = await prisma.member.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, bio: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
    res.json(members.map(m => ({ ...m, user: maskAvatar(m.user) })))
  } catch (err) { next(err) }
})

// POST /members — 僅團主可手動加入成員（一般由申請接受流程自動建立）
// 這裡沒有經過「申請」步驟，代管扣款要在這裡第一次做，走完整的 admitMemberIntoGroup（名額檢查 + 扣款），
// 避免繞過名額上限與 escrow 帳務
router.post('/', requireAuth, validate(addMemberSchema), async (req, res, next) => {
  try {
    const { groupId, userId } = req.body
    const [group, targetUser] = await Promise.all([
      prisma.group.findUnique({ where: { id: groupId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    ])
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'recruiting') return res.status(400).json({ message: '群組非招募中，無法手動加入成員' })
    if (!targetUser) return res.status(404).json({ message: '使用者不存在' })

    const seatCost = computeSeatCost(group)

    const member = await prisma.$transaction(tx => admitMemberIntoGroup(tx, {
      groupId,
      userId,
      seatCost,
      maxMembers: group.maxMembers,
      note:       `團主手動加入群組，代管 ${seatCost} PM`,
    }))

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

    // 填寫 serviceInfo 後，檢查是否全員完成 → 自動推進 pending_confirmation → pending_activation
    let groupAdvancedStatus = null
    if (req.body.serviceInfo !== undefined) {
      const allMembers = await prisma.member.findMany({ where: { groupId: existing.groupId } })
      const allFilled  = allMembers.every(m => m.serviceInfo != null)
      if (allFilled) {
        const grp = await prisma.group.findUnique({ where: { id: existing.groupId }, select: { status: true } })
        if (grp?.status === 'pending_confirmation') {
          await prisma.group.update({ where: { id: existing.groupId }, data: { status: 'pending_activation' } })
          groupAdvancedStatus = 'pending_activation'
        }
      }
    }

    res.json(groupAdvancedStatus ? { ...member, _groupAdvanced: groupAdvancedStatus } : member)
  } catch (err) { next(err) }
})

// DELETE /members/:id — 團主可移除成員；成員本人可退出群組
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.member.findUnique({
      where:   { id: req.params.id },
      include: { group: { select: { id: true, hostId: true, status: true, monthlyFee: true, billingCycle: true, escrowTokens: true } } },
    })
    if (!existing) return res.status(404).json({ message: '成員不存在' })

    const isHost   = existing.group.hostId === req.user.id
    const isSelf   = existing.userId === req.user.id
    if (!isHost && !isSelf) return res.status(403).json({ message: '無操作權限' })

    // 群組啟用後（pending_confirmation 以後）成員名單不可再變動
    if (!['recruiting', 'full'].includes(existing.group.status)) {
      return res.status(400).json({ message: '群組啟用後無法變更成員名單' })
    }

    const seatCost = computeSeatCost(existing.group)
    const refundAmount = Math.min(seatCost, existing.group.escrowTokens)

    const newCount = await prisma.$transaction(async (tx) => {
      await tx.member.delete({ where: { id: req.params.id } })
      const updated = await tx.group.update({
        where: { id: existing.groupId },
        data:  {
          currentMembers: { decrement: 1 },
          ...(existing.group.status === 'full' ? { status: 'recruiting' } : {}),
        },
        select: { currentMembers: true },
      })
      await refundEscrow(tx, {
        userId:  existing.userId,
        groupId: existing.groupId,
        amount:  refundAmount,
        note:    isHost ? '被團主移除，代管退款' : '自行退出，代管退款',
      })
      // 退出（left）或被移除（removed）後釋放 activeKey，讓使用者可重新申請同一群組。
      // 成員的 userId 不會等於團主，isHost / isSelf 必為互斥，用 isHost 就能區分兩種情境
      await tx.application.updateMany({
        where: { groupId: existing.groupId, userId: existing.userId, status: 'approved' },
        data:  { status: isHost ? 'removed' : 'left', activeKey: null },
      })
      return updated.currentMembers
    })

    res.status(200).json({ currentMembers: newCount })
  } catch (err) { next(err) }
})

export default router
