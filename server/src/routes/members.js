import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { computeSeatCost } from '../utils/pricing.js'
import { admitMemberIntoGroup, refundEscrow } from '../utils/membership.js'
import { maskAvatar } from '../lib/avatarVisibility.js'
import { notify, claimGroupStatus } from './groups/shared.js'

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
        user: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, bio: true } },
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
      include: {
        group: { select: { hostId: true, planName: true, sharedCredentials: true, service: { select: { name: true } } } },
        user:  { select: { name: true } },
      },
    })
    if (!existing) return res.status(404).json({ message: '成員不存在' })

    const isOwner = existing.userId === req.user.id
    const isHost  = existing.group.hostId === req.user.id
    if (!isOwner && !isHost) return res.status(403).json({ message: '無操作權限' })

    const member = await prisma.member.update({
      where: { id: req.params.id },
      data:  req.body,
    })

    const groupLabel = existing.group.planName ?? existing.group.service?.name ?? ''

    // 填寫 serviceInfo 後，檢查是否全員完成 → 自動推進 pending_confirmation → pending_activation
    let groupAdvancedStatus = null
    if (req.body.serviceInfo !== undefined) {
      // 團主提供帳密的服務（sharedCredentials 有值）成員端動作是「確認取得」不是「填寫」，通知文案要分開講
      const isSharedCredentials = !!existing.group.sharedCredentials
      notify({
        userId:  existing.group.hostId,
        type:    'service_info_filled',
        title:   isSharedCredentials ? '成員已提取帳號資訊' : '成員已填寫服務帳號',
        message: isSharedCredentials
          ? `${existing.user?.name ?? '成員'} 已確認取得「${groupLabel}」群組的帳號資訊。`
          : `${existing.user?.name ?? '成員'} 已填寫「${groupLabel}」群組的服務帳號資訊。`,
        meta:    { groupId: existing.groupId },
      })

      // 「帳號資訊」分頁的留言區也留一筆，跟團主標記帳號問題（見上方 dispute 那段的做法）同一套慣例，
      // 讓所有人打開分頁就直接看到提取進度，不用只靠通知才知道誰完成了
      if (isSharedCredentials) {
        prisma.credentialComment.create({
          data: {
            groupId:  existing.groupId,
            authorId: existing.userId,
            content:  '已成功提取帳號資訊',
          },
        }).catch(console.error)
      }

      const allMembers = await prisma.member.findMany({ where: { groupId: existing.groupId } })
      const allFilled  = allMembers.every(m => m.serviceInfo != null)
      if (allFilled) {
        const grp = await prisma.group.findUnique({ where: { id: existing.groupId }, select: { status: true } })
        if (grp?.status === 'pending_confirmation') {
          await prisma.group.update({ where: { id: existing.groupId }, data: { status: 'pending_activation' } })
          groupAdvancedStatus = 'pending_activation'

          // 最後一位成員完成提取/填寫才發這則，跟上面每個人都會收到一次的 service_info_filled 不同，
          // 這則只發一次、直接告訴團主「可以去啟用服務了」，不用自己數還剩幾個人沒填
          notify({
            userId:  existing.group.hostId,
            type:    'all_service_info_filled',
            title:   isSharedCredentials ? '成員已全部完成提取' : '成員已全部完成填寫',
            message: `「${groupLabel}」群組所有成員都已${isSharedCredentials ? '提取帳號資訊' : '填寫服務帳號'}，可以前往啟用服務了。`,
            meta:    { groupId: existing.groupId },
          })
        }
      }
    }

    if (isHost && req.body.serviceInfoIssueNote) {
      notify({
        userId:  existing.userId,
        type:    'service_info_issue',
        title:   '服務帳號需要修正',
        message: `團主在「${groupLabel}」發現服務帳號問題，請前往修正。`,
        meta:    { groupId: existing.groupId },
      })
    }

    res.json(groupAdvancedStatus ? { ...member, _groupAdvanced: groupAdvancedStatus } : member)
  } catch (err) { next(err) }
})

// DELETE /members/:id — 團主可移除成員；成員本人可退出群組
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.member.findUnique({
      where:   { id: req.params.id },
      include: {
        group: { select: { id: true, hostId: true, planName: true, status: true, monthlyFee: true, billingCycle: true, escrowTokens: true, currentMembers: true, service: { select: { name: true } } } },
        user:  { select: { name: true } },
      },
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

    const newCount = existing.group.currentMembers - 1

    await prisma.$transaction(async (tx) => {
      // 條件式搶佔：確保群組狀態沒有在上面的檢查之後、這筆交易真正寫入之前被團主鎖定群組
      // （full → pending_confirmation）改變過，避免鎖定後成員名單仍然可以被異動
      await claimGroupStatus(tx, existing.groupId, {
        fromStatus: ['recruiting', 'full'],
        data:       { currentMembers: { decrement: 1 } },
        message:    '群組已被鎖定，無法變更成員名單，請重新整理頁面',
      })
      await tx.member.delete({ where: { id: req.params.id } })
      // 上面的條件式搶佔已經確認過交易當下狀態仍是 recruiting/full 其中之一，這裡再用一次
      // 條件式更新把「額滿後有人離開」的 full → recruiting 轉換也一併原子化，不用依賴外層讀到的舊狀態
      await tx.group.updateMany({
        where: { id: existing.groupId, status: 'full' },
        data:  { status: 'recruiting' },
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
    })

    const groupLabel = existing.group.planName ?? existing.group.service?.name ?? ''
    if (isSelf) {
      notify({
        userId:  existing.group.hostId,
        type:    'member_left',
        title:   '成員已退出群組',
        message: `${existing.user?.name ?? '成員'} 已退出「${groupLabel}」群組。`,
        meta:    { groupId: existing.groupId },
      })
    } else {
      notify({
        userId:  existing.userId,
        type:    'member_removed',
        title:   '已被移出群組',
        message: `團主已將你移出「${groupLabel}」群組，代管費用已退還至你的PM幣餘額。`,
        meta:    { groupId: existing.groupId },
      })
    }

    res.status(200).json({ currentMembers: newCount })
  } catch (err) { next(err) }
})

export default router
