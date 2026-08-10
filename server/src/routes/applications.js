import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { computeSeatCost } from '../utils/pricing.js'
import { finalizeApprovedApplication, refundEscrow } from '../utils/membership.js'
import { maskAvatar } from '../lib/avatarVisibility.js'
import { notify, claimGroupStatus } from './groups/shared.js'

const router = Router()

const applySchema = z.object({
  groupId: z.string().min(1),
  message: z.string().max(300).optional(),
})

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'removed']),
})

// GET /applications — 回傳與目前用戶相關的申請（作為申請人 or 作為團主）
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: {
        OR: [
          { userId: req.user.id },                  // 我是申請人
          { group: { hostId: req.user.id } },       // 我是團主
        ],
      },
      include: {
        user:  { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true } },
        group: { select: { id: true, hostId: true, planName: true, serviceId: true, service: { select: { id: true, name: true } }, host: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(applications.map(app => ({ ...app, user: maskAvatar(app.user) })))
  } catch (err) { next(err) }
})

// POST /applications — 送出申請；代管扣款在這裡就會發生，不等團主接受
router.post('/', requireAuth, validate(applySchema), async (req, res, next) => {
  try {
    const { groupId, message } = req.body
    const [group, applicant] = await Promise.all([
      prisma.group.findUnique({ where: { id: groupId }, include: { service: { select: { name: true } } } }),
      prisma.user.findUnique({ where: { id: req.user.id }, select: { tokenBalance: true, creditScore: true, name: true } }),
    ])
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'recruiting') return res.status(400).json({ message: '此群組目前不開放申請' })
    if (group.hostId === req.user.id) return res.status(400).json({ message: '團主不能申請自己的群組' })

    // 重新申請冷卻期：曾經被移出這個群組（團主移除或逾期自動踢除，兩者都是 status: 'removed'）
    // 的話，24 小時內不能再申請同一個群組，避免搗蛋成員被踢除退款後立刻重新申請、無限循環卡流程；
    // 自願退出（left）、被拒絕（rejected）、自行取消（cancelled）都不算濫用情境，不受此限
    const lastRemoved = await prisma.application.findFirst({
      where:   { groupId, userId: req.user.id, status: 'removed' },
      orderBy: { updatedAt: 'desc' },
    })
    if (lastRemoved) {
      const cooldownEnds = new Date(lastRemoved.updatedAt)
      cooldownEnds.setHours(cooldownEnds.getHours() + 24)
      if (cooldownEnds > new Date()) {
        return res.status(400).json({
          message: `你先前被移出這個群組，需等到 ${cooldownEnds.toISOString()} 才能重新申請`,
          code:    'REAPPLY_COOLDOWN',
          cooldownEnds: cooldownEnds.toISOString(),
        })
      }
    }

    if ((applicant?.creditScore ?? 0) < group.minCreditScore) {
      return res.status(400).json({
        message: `信用分數不足，此群組需 ${group.minCreditScore} 分以上（目前 ${applicant?.creditScore ?? 0} 分）`,
        code:    'CREDIT_SCORE_TOO_LOW',
        required: group.minCreditScore,
      })
    }

    // 友善預檢：先讀一次餘額給使用者明確的錯誤訊息，實際扣款仍靠下面 transaction 內的條件式 updateMany 把關
    const seatCost = computeSeatCost(group)
    if ((applicant?.tokenBalance ?? 0) < seatCost) {
      return res.status(400).json({ message: `PM幣餘額不足，需要 ${seatCost} PM（目前 ${applicant?.tokenBalance ?? 0} PM）`, code: 'INSUFFICIENT_BALANCE', required: seatCost })
    }

    const existing = await prisma.application.findFirst({
      where:   { groupId, userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    if (existing && !['rejected', 'removed', 'left', 'cancelled'].includes(existing.status)) {
      return res.status(409).json({ message: '你已有一筆進行中的申請' })
    }

    try {
      // activeKey 搭配 (groupId, userId, activeKey) 的 unique index，即使兩個併發請求都通過上面的
      // findFirst 檢查，第二筆 create 仍會在資料庫層被擋下，不會造成重複的進行中申請
      const application = await prisma.$transaction(async (tx) => {
        // 條件式扣款：避免上面預檢之後、這筆 transaction 執行前，餘額被同一使用者的另一個併發請求先扣走
        const charged = await tx.user.updateMany({
          where: { id: req.user.id, tokenBalance: { gte: seatCost } },
          data:  { tokenBalance: { decrement: seatCost } },
        })
        if (charged.count === 0) {
          const err = new Error(`PM幣餘額不足，需要 ${seatCost} PM`)
          err.balanceRace = true
          throw err
        }

        // 條件式代管：避免上面預檢之後、這筆 transaction 執行前，團主剛好解散/鎖定群組——
        // 沒有這層檢查的話，代管金額會被加進一個已經不開放申請的群組，卡在裡面永遠沒有人能審核、
        // 也不會有任何後續流程幫這筆申請退款
        await claimGroupStatus(tx, groupId, {
          fromStatus:   'recruiting',
          data:         { escrowTokens: { increment: seatCost } },
          message:      '此群組剛好被團主解散或已額滿，無法申請',
          responseCode: 'GROUP_NOT_RECRUITING',
        })

        // escrowAmount 記錄這筆申請實際扣了多少錢，之後退款要用這個值，不能用當下即時價格重算
        // （群組價格/計費週期之後可能被團主改掉，退款金額會跟當初真正扣的錢對不上）
        const created = await tx.application.create({
          data: { groupId, userId: req.user.id, message, activeKey: 'active', escrowAmount: seatCost },
        })

        await tx.tokenTransaction.create({
          data: { userId: req.user.id, type: 'escrow', amount: -seatCost, relatedGroupId: groupId, note: `申請加入群組代管 ${seatCost} PM` },
        })

        return created
      })

      const groupLabel = group.planName ?? group.service?.name ?? ''
      notify({
        userId:  req.user.id,
        type:    'application_sent',
        title:   '申請已送出',
        message: `你的加入申請已送達「${groupLabel}」團主，等待審核。`,
        meta:    { groupId, applicationId: application.id },
      })
      notify({
        userId:  group.hostId,
        type:    'new_application',
        title:   '收到新的加入申請',
        message: `${applicant?.name ?? '有人'} 申請加入「${groupLabel}」群組。`,
        meta:    { groupId, applicationId: application.id },
      })

      res.status(201).json(application)
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ message: '你已有一筆進行中的申請' })
      if (err.balanceRace) return res.status(400).json({ message: err.message, code: 'INSUFFICIENT_BALANCE', required: seatCost })
      if (err.responseCode) return res.status(err.statusCode ?? 409).json({ message: err.message, code: err.responseCode })
      throw err
    }
  } catch (err) { next(err) }
})

// DELETE /applications/:id — 申請人取消自己的 pending 申請；退還申請當下代管的金額
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where:   { id: req.params.id },
      include: {
        group: { select: { id: true, hostId: true, planName: true, monthlyFee: true, billingCycle: true, escrowTokens: true, service: { select: { name: true } } } },
        user:  { select: { name: true } },
      },
    })
    if (!application) return res.status(404).json({ message: '申請不存在' })
    if (application.userId !== req.user.id) return res.status(403).json({ message: '僅申請人可取消' })
    if (application.status !== 'pending') return res.status(400).json({ message: '只能取消審核中的申請' })

    // 退款用申請當下實際扣的金額（escrowAmount），不用即時價格重算；舊資料沒有這個值才 fallback
    // 用 computeSeatCost；並跟目前 escrowTokens 取 min，避免代管餘額因故不足時被扣成負數
    const escrowAmount = application.escrowAmount ?? computeSeatCost(application.group)
    const refundAmount = Math.min(escrowAmount, application.group.escrowTokens)

    const updated = await prisma.$transaction(async (tx) => {
      // 條件式更新：僅在仍為 pending 時才退款，避免跟團主同時審核造成重複退款
      const claimed = await tx.application.updateMany({
        where: { id: req.params.id, status: 'pending' },
        data:  { status: 'cancelled', activeKey: null },
      })
      if (claimed.count === 0) {
        const err = new Error('此申請已被處理，請重新整理頁面')
        err.statusCode = 409
        throw err
      }

      await refundEscrow(tx, { userId: req.user.id, groupId: application.groupId, amount: refundAmount, note: '取消申請，代管退款' })

      return tx.application.findUnique({ where: { id: req.params.id } })
    })

    const groupLabel = application.group.planName ?? application.group.service?.name ?? ''
    notify({
      userId:  application.group.hostId,
      type:    'application_cancelled',
      title:   '申請人已取消申請',
      message: `${application.user?.name ?? '申請人'} 已取消加入「${groupLabel}」群組的申請。`,
      meta:    { groupId: application.groupId, applicationId: req.params.id },
    })

    res.json(updated)
  } catch (err) { next(err) }
})

// PATCH /applications/:id — 團主審核
router.patch('/:id', requireAuth, validate(reviewSchema), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where:   { id: req.params.id },
      include: { group: { select: { hostId: true, planName: true, monthlyFee: true, billingCycle: true, escrowTokens: true, service: { select: { name: true } } } } },
    })
    if (!application) return res.status(404).json({ message: '申請不存在' })
    if (application.group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可審核' })

    const { status } = req.body
    const groupLabel = application.group.planName ?? application.group.service?.name ?? ''

    if (status !== 'approved') {
      // 拒絕／移除都會走到這裡：member 被移除（status: 'removed'）時，DELETE /members/:id 已經處理過
      // 自己的退款，這裡的申請當下狀態會是 'approved' 不是 'pending'，所以下面條件式 updateMany 不會
      // 再退一次款；但不論退不退款，狀態轉換本身都要無條件套用，避免申請卡在舊狀態、activeKey 卡死
      // 導致使用者永遠無法重新申請同一群組。
      const escrowAmount = application.escrowAmount ?? computeSeatCost(application.group)
      const refundAmount = Math.min(escrowAmount, application.group.escrowTokens)

      const updated = await prisma.$transaction(async (tx) => {
        const claimed = await tx.application.updateMany({
          where: { id: req.params.id, status: 'pending' },
          data:  { status, activeKey: null },
        })
        if (claimed.count > 0) {
          await refundEscrow(tx, { userId: application.userId, groupId: application.groupId, amount: refundAmount, note: '申請未通過，代管退款' })
        } else {
          // 不是從 pending 轉過來的（例如成員已被移除），仍需要把狀態同步過去，只是不能再退一次款
          await tx.application.update({ where: { id: req.params.id }, data: { status, activeKey: null } })
        }

        return tx.application.findUnique({ where: { id: req.params.id } })
      })

      // 'removed' 是成員被移出群組後同步狀態，member_removed 通知已經在 DELETE /members/:id 發過，這裡不重複
      if (status === 'rejected') {
        notify({
          userId:  application.userId,
          type:    'application_rejected',
          title:   '申請未通過',
          message: `很遺憾，你加入「${groupLabel}」群組的申請未通過，代管費用已退還至你的PM幣餘額，你可以繼續探索其他群組。`,
          meta:    { groupId: application.groupId, applicationId: req.params.id },
        })
      }

      return res.json(updated)
    }

    // 名額檢查、審核狀態變更、成員/訂閱建立全部包在同一個 transaction；代管扣款已在申請時完成，
    // 這裡改呼叫 finalizeApprovedApplication，不會再扣一次款
    const updated = await prisma.$transaction(async (tx) => {
      // 條件式更新：僅在仍為 pending 時才能接受，避免重複點擊/併發請求造成同一筆申請被重複接受、重複入群
      const claimed = await tx.application.updateMany({
        where: { id: req.params.id, status: 'pending' },
        data:  { status: 'approved' },
      })
      if (claimed.count === 0) {
        const err = new Error('此申請已被處理，請重新整理頁面')
        err.statusCode = 409
        throw err
      }

      const group = await tx.group.findUnique({
        where:  { id: application.groupId },
        select: { maxMembers: true },
      })
      if (!group) {
        const err = new Error('群組不存在')
        err.statusCode = 404
        throw err
      }

      await finalizeApprovedApplication(tx, {
        groupId:    application.groupId,
        userId:     application.userId,
        maxMembers: group.maxMembers,
      })

      return tx.application.findUnique({ where: { id: req.params.id } })
    })

    notify({
      userId:  application.userId,
      type:    'application_approved',
      title:   '申請已通過',
      message: `恭喜！你加入「${groupLabel}」群組的申請已通過，請前往我的訂閱查看。`,
      meta:    { groupId: application.groupId, applicationId: req.params.id },
    })

    res.json(updated)
  } catch (err) { next(err) }
})

export default router
