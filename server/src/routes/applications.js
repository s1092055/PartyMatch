import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

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
        user:  { select: { id: true, name: true, avatarColor: true, avatarInitial: true, creditScore: true } },
        group: { select: { id: true, hostId: true, planName: true, serviceId: true, service: { select: { id: true, name: true } }, host: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(applications)
  } catch (err) { next(err) }
})

// POST /applications — 送出申請
router.post('/', requireAuth, validate(applySchema), async (req, res, next) => {
  try {
    const { groupId, message } = req.body
    const [group, applicant] = await Promise.all([
      prisma.group.findUnique({ where: { id: groupId } }),
      prisma.user.findUnique({ where: { id: req.user.id }, select: { tokenBalance: true } }),
    ])
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.status !== 'recruiting') return res.status(400).json({ message: '此群組目前不開放申請' })
    if (group.hostId === req.user.id) return res.status(400).json({ message: '團主不能申請自己的群組' })

    // 餘額預檢：確保申請人有足夠PM幣支付未來的代管費用
    const seatCost = group.billingCycle === 'yearly'
      ? Math.round(group.monthlyFee * 12)
      : Math.round(group.monthlyFee)
    if ((applicant?.tokenBalance ?? 0) < seatCost) {
      return res.status(400).json({ message: `PM幣餘額不足，需要 ${seatCost} PM（目前 ${applicant?.tokenBalance ?? 0} PM）`, code: 'INSUFFICIENT_BALANCE', required: seatCost })
    }

    const existing = await prisma.application.findFirst({
      where:   { groupId, userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    if (existing) {
      // 已被拒絕、移除或自行退出 → 允許重新申請（建立新記錄，保留歷史）
      if (existing.status === 'rejected' || existing.status === 'removed' || existing.status === 'left' || existing.status === 'withdrawn') {
        const application = await prisma.application.create({
          data: { groupId, userId: req.user.id, message },
        })
        return res.status(201).json(application)
      }
      return res.status(409).json({ message: '你已有一筆進行中的申請' })
    }

    const application = await prisma.application.create({
      data: { groupId, userId: req.user.id, message },
    })
    res.status(201).json(application)
  } catch (err) { next(err) }
})

// DELETE /applications/:id — 申請人撤回自己的 pending 申請
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id } })
    if (!application) return res.status(404).json({ message: '申請不存在' })
    if (application.userId !== req.user.id) return res.status(403).json({ message: '僅申請人可撤回' })
    if (application.status !== 'pending') return res.status(400).json({ message: '只能撤回審核中的申請' })

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data:  { status: 'withdrawn' },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

// PATCH /applications/:id — 團主審核
router.patch('/:id', requireAuth, validate(reviewSchema), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where:   { id: req.params.id },
      include: { group: { select: { hostId: true, monthlyFee: true, billingCycle: true } } },
    })
    if (!application) return res.status(404).json({ message: '申請不存在' })
    if (application.group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可審核' })

    const { status } = req.body

    if (status !== 'approved') {
      const updated = await prisma.application.update({
        where: { id: req.params.id },
        data:  { status },
      })
      return res.json(updated)
    }

    // 計算席位費用（yearly = monthlyFee * 12）
    const seatCost = application.group.billingCycle === 'yearly'
      ? Math.round(application.group.monthlyFee * 12)
      : Math.round(application.group.monthlyFee)

    // 餘額檢查、名額檢查、審核狀態變更、成員/訂閱建立、代管扣款全部包在同一個 transaction，
    // 避免餘額不足時 application 已變 approved 但後續建立失敗的資料不一致
    const updated = await prisma.$transaction(async (tx) => {
      const applicant = await tx.user.findUnique({
        where:  { id: application.userId },
        select: { tokenBalance: true },
      })
      if (!applicant || applicant.tokenBalance < seatCost) {
        const err = new Error('申請人PM幣餘額不足，無法核准')
        err.statusCode = 400
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

      // 條件式更新：status/currentMembers 在寫入當下重新核對，避免併發核准導致超額或核准到已非招募中的群組
      const capacity = await tx.group.updateMany({
        where: {
          id:             application.groupId,
          status:         'recruiting',
          currentMembers: { lt: group.maxMembers },
        },
        data: { currentMembers: { increment: 1 }, escrowTokens: { increment: seatCost } },
      })
      if (capacity.count === 0) {
        const err = new Error('群組名額已滿或已結束招募，無法核准')
        err.statusCode = 409
        throw err
      }

      const app = await tx.application.update({
        where: { id: req.params.id },
        data:  { status: 'approved' },
      })

      // 建立成員與訂閱記錄
      await tx.member.upsert({
        where:  { groupId_userId: { groupId: application.groupId, userId: application.userId } },
        create: { groupId: application.groupId, userId: application.userId },
        update: {},
      })
      await tx.subscription.upsert({
        where:  { groupId_userId: { groupId: application.groupId, userId: application.userId } },
        create: { groupId: application.groupId, userId: application.userId },
        update: {},
      })
      // 代管：扣除申請人PM幣
      await tx.user.update({
        where: { id: application.userId },
        data:  { tokenBalance: { decrement: seatCost } },
      })
      // 寫入PM幣交易紀錄
      await tx.tokenTransaction.create({
        data: {
          userId:        application.userId,
          type:          'escrow',
          amount:        -seatCost,
          relatedGroupId: application.groupId,
          note:          `加入群組代管 ${seatCost} PM`,
        },
      })

      // 核准後自動檢查是否額滿，若滿則推進到 full
      const updatedGroup = await tx.group.findUnique({
        where:  { id: application.groupId },
        select: { currentMembers: true, maxMembers: true },
      })
      if (updatedGroup.currentMembers >= updatedGroup.maxMembers) {
        await tx.group.update({
          where: { id: application.groupId },
          data:  { status: 'full' },
        })
      }

      return app
    })

    res.json(updated)
  } catch (err) { next(err) }
})

export default router
