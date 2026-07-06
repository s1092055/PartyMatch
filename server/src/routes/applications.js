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

    // 餘額預檢：確保申請人有足夠代幣支付未來的代管費用
    const seatCost = group.billingCycle === 'yearly'
      ? Math.round(group.monthlyFee * 12)
      : Math.round(group.monthlyFee)
    if ((applicant?.tokenBalance ?? 0) < seatCost) {
      return res.status(400).json({ message: `代幣餘額不足，需要 ${seatCost} PM（目前 ${applicant?.tokenBalance ?? 0} PM）`, code: 'INSUFFICIENT_BALANCE', required: seatCost })
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
      include: { group: { select: { id: true, hostId: true, status: true, monthlyFee: true, billingCycle: true, currentMembers: true, maxMembers: true } } },
    })
    if (!application) return res.status(404).json({ message: '申請不存在' })
    if (application.group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可審核' })

    const { status } = req.body
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data:  { status },
    })

    if (status === 'approved') {
      // 計算席位費用（yearly = monthlyFee * 12）
      const seatCost = application.group.billingCycle === 'yearly'
        ? Math.round(application.group.monthlyFee * 12)
        : Math.round(application.group.monthlyFee)

      // 檢查申請人代幣餘額是否足夠
      const applicant = await prisma.user.findUnique({
        where:  { id: application.userId },
        select: { tokenBalance: true },
      })
      if (applicant.tokenBalance < seatCost) {
        return res.status(400).json({ message: '申請人代幣餘額不足，無法核准' })
      }

      await prisma.$transaction([
        // 建立成員與訂閱記錄
        prisma.member.upsert({
          where:  { groupId_userId: { groupId: application.groupId, userId: application.userId } },
          create: { groupId: application.groupId, userId: application.userId },
          update: {},
        }),
        prisma.subscription.upsert({
          where:  { groupId_userId: { groupId: application.groupId, userId: application.userId } },
          create: { groupId: application.groupId, userId: application.userId },
          update: {},
        }),
        // 代管：扣除申請人代幣，增加群組 escrowTokens
        prisma.user.update({
          where: { id: application.userId },
          data:  { tokenBalance: { decrement: seatCost } },
        }),
        prisma.group.update({
          where: { id: application.groupId },
          data:  { currentMembers: { increment: 1 }, escrowTokens: { increment: seatCost } },
        }),
        // 寫入代幣交易紀錄
        prisma.tokenTransaction.create({
          data: {
            userId:        application.userId,
            type:          'escrow',
            amount:        -seatCost,
            relatedGroupId: application.groupId,
            note:          `加入群組代管 ${seatCost} PM`,
          },
        }),
      ])

      // 核准後自動檢查是否額滿，若滿則推進到 full
      const latestGroup = await prisma.group.findUnique({
        where: { id: application.groupId },
        select: { currentMembers: true, maxMembers: true, status: true },
      })
      if (
        latestGroup &&
        latestGroup.currentMembers >= latestGroup.maxMembers &&
        latestGroup.status === 'recruiting'
      ) {
        await prisma.group.update({
          where: { id: application.groupId },
          data:  { status: 'full' },
        })
      }
    }

    res.json(updated)
  } catch (err) { next(err) }
})

export default router
