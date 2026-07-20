import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { computeSeatCost } from '../utils/pricing.js'
import { admitMemberIntoGroup } from '../utils/membership.js'

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
    const seatCost = computeSeatCost(group)
    if ((applicant?.tokenBalance ?? 0) < seatCost) {
      return res.status(400).json({ message: `PM幣餘額不足，需要 ${seatCost} PM（目前 ${applicant?.tokenBalance ?? 0} PM）`, code: 'INSUFFICIENT_BALANCE', required: seatCost })
    }

    const existing = await prisma.application.findFirst({
      where:   { groupId, userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    if (existing && !['rejected', 'removed', 'left', 'withdrawn'].includes(existing.status)) {
      return res.status(409).json({ message: '你已有一筆進行中的申請' })
    }

    try {
      // activeKey 搭配 (groupId, userId, activeKey) 的 unique index，即使兩個併發請求都通過上面的
      // findFirst 檢查，第二筆 create 仍會在資料庫層被擋下，不會造成重複的進行中申請
      const application = await prisma.application.create({
        data: { groupId, userId: req.user.id, message, activeKey: 'active' },
      })
      res.status(201).json(application)
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ message: '你已有一筆進行中的申請' })
      throw err
    }
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
      data:  { status: 'withdrawn', activeKey: null },
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
      // rejected/removed 都代表這筆申請不再進行中，釋放 activeKey 讓使用者可以重新申請
      const updated = await prisma.application.update({
        where: { id: req.params.id },
        data:  { status, activeKey: null },
      })
      return res.json(updated)
    }

    const seatCost = computeSeatCost(application.group)

    // 餘額檢查、名額檢查、審核狀態變更、成員/訂閱建立、代管扣款全部包在同一個 transaction，
    // 避免餘額不足時 application 已變 approved 但後續建立失敗的資料不一致
    const updated = await prisma.$transaction(async (tx) => {
      // 條件式更新：僅在仍為 pending 時才能核准，避免重複點擊/併發請求造成同一筆申請被重複扣款、重複入群
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

      await admitMemberIntoGroup(tx, {
        groupId:    application.groupId,
        userId:     application.userId,
        seatCost,
        maxMembers: group.maxMembers,
        note:       `加入群組代管 ${seatCost} PM`,
      })

      return tx.application.findUnique({ where: { id: req.params.id } })
    })

    res.json(updated)
  } catch (err) { next(err) }
})

export default router
