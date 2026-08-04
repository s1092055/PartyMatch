import { Router } from 'express'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { computeSeatCost } from '../../utils/pricing.js'
import { notify, notifyGroupConversation } from './shared.js'
import { maskAvatar } from '../../lib/avatarVisibility.js'

const router = Router()

function maskGroupHost(group) {
  return group?.host ? { ...group, host: maskAvatar(group.host) } : group
}

const disputeSchema = z.object({
  reason:      z.string().trim().min(1).max(500),
  evidenceUrl: z.string().url().optional(),
})

// POST /groups/:id/activate — pending_activation → confirming（48h 確認期開始）
router.post('/:id/activate', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'pending_activation') return res.status(400).json({ message: `群組狀態為 ${group.status}，無法啟用（需為 pending_activation）` })

    const confirmDeadline = new Date()
    confirmDeadline.setHours(confirmDeadline.getHours() + 48)

    const updated = await prisma.group.update({
      where: { id: req.params.id },
      data: { status: 'confirming', confirmDeadline },
      include: {
        host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
        service: true,
        _count:  { select: { members: true } },
      },
    })
    res.json(maskGroupHost(updated))
  } catch (err) { next(err) }
})

// POST /groups/:id/confirm — 成員確認服務正常（confirming 期間）
router.post('/:id/confirm', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        host:    { select: { id: true } },
        service: { select: { name: true } },
      },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'confirming') return res.status(400).json({ message: `群組狀態為 ${group.status}，不在確認期` })

    const member = group.members.find(m => m.userId === req.user.id)
    if (!member) return res.status(403).json({ message: '你不是此群組成員' })

    const now = new Date()
    const groupLabel = group.planName ?? group.service?.name ?? ''

    await prisma.member.update({
      where: { id: member.id },
      data:  { confirmedAt: now },
    })

    // 團主目前完全不會被通知有成員確認服務，先寫一則系統訊息讓團主至少能在聊天室看到進度
    notifyGroupConversation(req.params.id, member.userId, `${member.user.name} 已確認服務正常。`).catch(console.error)

    // 確認全員是否都已確認（含剛才更新的成員）
    const updatedMembers = await prisma.member.findMany({ where: { groupId: req.params.id } })
    const allConfirmed   = updatedMembers.every(m => m.id === member.id ? true : m.confirmedAt != null)
    const deadlinePassed = group.confirmDeadline && new Date(group.confirmDeadline) <= now

    if (allConfirmed || deadlinePassed) {
      // 撥款：escrowTokens → host.tokenBalance
      const [updated] = await prisma.$transaction([
        prisma.group.update({
          where: { id: req.params.id },
          data:  { status: 'active', confirmDeadline: null },
          include: {
            host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
            service: true,
            _count:  { select: { members: true } },
          },
        }),
        prisma.user.update({
          where: { id: group.host.id },
          data:  { tokenBalance: { increment: group.escrowTokens } },
        }),
        prisma.group.update({
          where: { id: req.params.id },
          data:  { escrowTokens: 0 },
        }),
        prisma.tokenTransaction.create({
          data: {
            userId:        group.host.id,
            type:          'release',
            amount:        group.escrowTokens,
            relatedGroupId: req.params.id,
            note:          '確認期結束，代管款項撥付',
          },
        }),
        prisma.subscription.updateMany({
          where: { groupId: req.params.id },
          data:  { status: 'active' },
        }),
      ])

      prisma.notification.create({
        data: {
          userId:  group.host.id,
          type:    'escrow_released',
          title:   '代管款項已撥款',
          message: `「${groupLabel}」群組確認期結束，代管款項已撥入你的PM幣餘額。`,
          meta:    { groupId: req.params.id },
        },
      }).catch(console.error)
      notifyGroupConversation(req.params.id, member.userId, `確認期結束，代管款項已撥款給團主。`).catch(console.error)

      return res.json({ group: maskGroupHost({ ...updated, escrowTokens: 0 }), released: true })
    }

    res.json({ group: null, released: false })
  } catch (err) { next(err) }
})

// POST /groups/:id/dispute — 成員申訴（confirming → disputed）
router.post('/:id/dispute', requireAuth, validate(disputeSchema), async (req, res, next) => {
  try {
    const { reason, evidenceUrl } = req.body

    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        service: { select: { name: true } },
      },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'confirming') return res.status(400).json({ message: `群組狀態為 ${group.status}，不在確認期` })

    const member = group.members.find(m => m.userId === req.user.id)
    if (!member) return res.status(403).json({ message: '你不是此群組成員' })

    // 跟確認期（confirmDeadline）用同一套 48 小時的節奏，避免使用者對兩個時限有不同期待
    const disputeDeadline = new Date()
    disputeDeadline.setHours(disputeDeadline.getHours() + 48)
    const groupLabel = group.planName ?? group.service?.name ?? ''

    const [updated] = await prisma.$transaction([
      prisma.group.update({
        where: { id: req.params.id },
        data:  { status: 'disputed', disputeDeadline },
        include: {
          host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
          service: true,
          _count:  { select: { members: true } },
        },
      }),
      prisma.member.update({
        where: { id: member.id },
        data:  {
          serviceInfoIssueNote: reason.trim(),
          ...(evidenceUrl ? { disputeEvidenceUrl: evidenceUrl } : {}),
        },
      }),
    ])
    updated.host = maskAvatar(updated.host)

    prisma.notification.create({
      data: {
        userId:  group.hostId,
        type:    'dispute_raised',
        title:   '收到成員問題回報',
        message: `${member.user.name} 針對「${groupLabel}」服務回報問題，將於 48 小時內處理完成。`,
        meta:    { groupId: req.params.id },
      },
    }).catch(console.error)
    notifyGroupConversation(req.params.id, member.userId, `${member.user.name} 回報了服務問題，等待處理。`).catch(console.error)

    res.json(updated)
  } catch (err) { next(err) }
})

// POST /groups/:id/cancel — 解散群組（啟用前），退還所有代管給成員
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可解散群組' })

    const cancellable = ['recruiting', 'full']
    if (!cancellable.includes(group.status)) {
      return res.status(400).json({ message: `群組已鎖定（狀態為 ${group.status}），無法解散` })
    }

    const seatCost = computeSeatCost(group)

    await prisma.$transaction(async (tx) => {
      // 條件式更新：確保狀態沒有在讀取跟寫入之間被其他請求（例如同時退出/被移除）變動過
      const updated = await tx.group.updateMany({
        where: { id: req.params.id, status: { in: cancellable } },
        data:  { status: 'cancelled', escrowTokens: 0 },
      })
      if (updated.count === 0) {
        const err = new Error('群組狀態已變動，請重新整理頁面')
        err.statusCode = 409
        throw err
      }

      // 在同一個 transaction 裡重新查詢當下真正還在群組內的成員，不用外層讀到的舊名單，
      // 避免跟同時發生的退出/移除撞在一起造成重複退款
      const currentMembers = await tx.member.findMany({ where: { groupId: req.params.id } })
      if (currentMembers.length > 0) {
        // 每人退款金額相同，一次 updateMany/createMany 取代逐筆 await，跟其他退款端點手法一致
        await tx.user.updateMany({
          where: { id: { in: currentMembers.map(m => m.userId) } },
          data:  { tokenBalance: { increment: seatCost } },
        })
        await tx.tokenTransaction.createMany({
          data: currentMembers.map(m => ({
            userId:        m.userId,
            type:          'refund',
            amount:        seatCost,
            relatedGroupId: req.params.id,
            note:          '群組解散，代管退款',
          })),
        })
      }
    })

    res.json({ status: 'cancelled' })
  } catch (err) { next(err) }
})

// POST /groups/:id/lock — full → pending_confirmation
router.post('/:id/lock', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: true, service: true },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'full') return res.status(400).json({ message: `群組狀態為 ${group.status}，無法鎖定（需為 full）` })

    // 設定下次扣款日（從今天起算一個計費週期）
    const nextBillingDate = new Date()
    if (group.billingCycle === 'yearly') nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    // 填寫服務帳號資訊的期限：鎖定時間 + 24h（僅供前端顯示倒數，逾期不會自動處理）
    const serviceInfoDeadline = new Date()
    serviceInfoDeadline.setHours(serviceInfoDeadline.getHours() + 24)

    // 無官方多人邀請機制的服務（sharingMethod: shared_credentials），團主鎖定當下順便提供帳密，
    // 後端不知道 sharingMethod 分類（只存在前端 catalog），單純是有傳就存、沒傳就維持 null
    const sharedCredentials = typeof req.body?.sharedCredentials === 'string' && req.body.sharedCredentials.trim()
      ? req.body.sharedCredentials.trim()
      : undefined

    const [updated] = await prisma.$transaction([
      prisma.group.update({
        where: { id: req.params.id },
        data: { status: 'pending_confirmation', serviceInfoDeadline, ...(sharedCredentials !== undefined && { sharedCredentials }) },
        include: {
          host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
          service: true,
          _count:  { select: { members: true } },
        },
      }),
      prisma.subscription.updateMany({
        where: { groupId: req.params.id },
        data:  { nextBillingDate },
      }),
    ])
    updated.host = maskAvatar(updated.host)

    // 聊天室已由前端在鎖定前先建立好，這裡補一則系統訊息告知所有成員聊天室已啟用
    const groupLabel = group.planName ?? group.service?.name ?? ''
    notifyGroupConversation(req.params.id, group.hostId, `「${groupLabel}」聊天室已啟用。`).catch(console.error)

    res.json(updated)
  } catch (err) { next(err) }
})

// POST /groups/:id/adjudicate — 平台裁定申訴（需管理員）
// winner: 'member' → 退款給申訴成員並移出群組；'host' → 撥款給團主
router.post('/:id/adjudicate', requireAdmin, async (req, res, next) => {
  try {
    const { winner, reason } = req.body
    if (!['member', 'host'].includes(winner)) return res.status(400).json({ message: 'winner 必須為 member 或 host' })
    if (!reason?.trim()) return res.status(400).json({ message: '請填寫裁定說明' })

    const group = await prisma.group.findUnique({
      where:   { id: req.params.id },
      include: { members: { include: { user: { select: { id: true } } } }, service: { select: { name: true } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'disputed') return res.status(400).json({ message: `群組狀態為 ${group.status}，不在申訴期` })

    // 找申訴成員（有 serviceInfoIssueNote 的那位）
    const disputeMember = group.members.find(m => m.serviceInfoIssueNote)
    if (!disputeMember) return res.status(400).json({ message: '找不到申訴成員' })

    const seatCost = computeSeatCost(group)
    const groupLabel = group.planName ?? group.service?.name ?? ''

    if (winner === 'member') {
      // 退款給申訴成員，移出群組，其他人代管不變，群組回 active
      await prisma.$transaction([
        prisma.group.update({
          where: { id: group.id },
          data:  { status: 'active', disputeDeadline: null, escrowTokens: { decrement: seatCost } },
        }),
        prisma.user.update({
          where: { id: disputeMember.userId },
          data:  { tokenBalance: { increment: seatCost } },
        }),
        prisma.tokenTransaction.create({
          data: { userId: disputeMember.userId, type: 'refund', amount: seatCost, relatedGroupId: group.id, note: `問題處理結果：${reason.trim()}` },
        }),
        prisma.member.delete({ where: { id: disputeMember.id } }),
        prisma.subscription.updateMany({
          where: { groupId: group.id, userId: disputeMember.userId },
          data:  { status: 'ended' },
        }),
      ])

      notify({
        userId:  disputeMember.userId,
        type:    'dispute_resolved',
        title:   '問題處理結果',
        message: `你對「${groupLabel}」回報的問題已確認，本期費用已退還至你的PM幣餘額。`,
        meta:    { groupId: group.id },
      })
      notify({
        userId:  group.hostId,
        type:    'dispute_resolved',
        title:   '問題處理結果',
        message: `「${groupLabel}」的問題處理結果為退款給成員，該成員本期費用已退還並移出群組。`,
        meta:    { groupId: group.id },
      })
    } else {
      // 撥款給團主，群組回 active，全員訂閱啟用
      await prisma.$transaction([
        prisma.group.update({
          where: { id: group.id },
          data:  { status: 'active', disputeDeadline: null, escrowTokens: 0 },
        }),
        prisma.user.update({
          where: { id: group.hostId },
          data:  { tokenBalance: { increment: group.escrowTokens } },
        }),
        prisma.tokenTransaction.create({
          data: { userId: group.hostId, type: 'release', amount: group.escrowTokens, relatedGroupId: group.id, note: `問題處理結果：${reason.trim()}` },
        }),
        prisma.subscription.updateMany({ where: { groupId: group.id }, data: { status: 'active' } }),
      ])

      notify({
        userId:  group.hostId,
        type:    'escrow_released',
        title:   '代管款項已撥款',
        message: `問題處理結果：「${groupLabel}」代管款項已撥入你的PM幣餘額。`,
        meta:    { groupId: group.id },
      })
      notify({
        userId:  disputeMember.userId,
        type:    'dispute_resolved',
        title:   '問題處理結果',
        message: `你對「${groupLabel}」回報的問題經確認後，本期費用已撥款給團主。`,
        meta:    { groupId: group.id },
      })
    }

    res.json({ winner, disputeMemberId: disputeMember.userId })
  } catch (err) { next(err) }
})

// POST /groups/:id/renew — active → pending_confirmation，向每位成員收取本期代管費用並重置帳號資訊
router.post('/:id/renew', requireAuth, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: { include: { user: { select: { id: true, tokenBalance: true } } } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'active') return res.status(400).json({ message: `群組狀態為 ${group.status}，無法開始新一期（需為 active）` })

    const seatCost = computeSeatCost(group)

    const memberIds = group.members.map(m => m.userId)
    const insufficient = group.members.filter(m => m.user.tokenBalance < seatCost)
    if (insufficient.length > 0) {
      return res.status(400).json({
        message: `${insufficient.length} 位成員PM幣餘額不足，無法開始新一期收款`,
        code: 'INSUFFICIENT_BALANCE',
        memberIds: insufficient.map(m => m.userId),
      })
    }

    const base = new Date(group.nextBillingDate ?? new Date())
    if (group.billingCycle === 'yearly') base.setFullYear(base.getFullYear() + 1)
    else base.setMonth(base.getMonth() + 1)

    // 續訂後回到跟第一次鎖定群組相同的填寫帳號資訊階段，比照設定 24h 倒數
    const serviceInfoDeadline = new Date()
    serviceInfoDeadline.setHours(serviceInfoDeadline.getHours() + 24)

    const updated = await prisma.$transaction(async (tx) => {
      // 向每位成員收取本期代管費用；用 gte 條件式扣款，避免上方檢查後、寫入前餘額被其他請求變動造成扣成負數
      const charged = await tx.user.updateMany({
        where: { id: { in: memberIds }, tokenBalance: { gte: seatCost } },
        data:  { tokenBalance: { decrement: seatCost } },
      })
      if (charged.count !== memberIds.length) {
        const err = new Error('部分成員PM幣餘額於扣款當下不足，請稍後重試')
        err.statusCode = 409
        throw err
      }

      await tx.tokenTransaction.createMany({
        data: memberIds.map(userId => ({
          userId,
          type:           'escrow',
          amount:         -seatCost,
          relatedGroupId: req.params.id,
          note:           `新一期代管 ${seatCost} PM`,
        })),
      })

      // 清空所有成員的服務帳號資訊，讓他們重新填寫
      await tx.member.updateMany({
        where: { groupId: req.params.id },
        data:  { serviceInfo: null, serviceInfoIssueNote: null, confirmedAt: null },
      })

      return tx.group.update({
        where: { id: req.params.id },
        data:  { status: 'pending_confirmation', nextBillingDate: base, serviceInfoDeadline, escrowTokens: { increment: seatCost * memberIds.length } },
        include: {
          host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
          service: true,
          _count:  { select: { members: true } },
        },
      })
    })

    res.json(maskGroupHost(updated))
  } catch (err) { next(err) }
})

export default router
