import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const updateSubscriptionSchema = z.object({
  subscriptionAccount: z.string().optional(),
  status:              z.enum(['pending', 'active', 'ended']).optional(),
  nextBillingDate:     z.string().optional(),
})

// 距下次扣款日 7 天內時，為成員發送一次「即將續訂」提醒（以 meta.nextBillingDate 避免同一期重複發送）
async function notifyUpcomingRenewals(subscriptions, userId) {
  const candidates = subscriptions
    .filter(s => s.userId === userId && s.status === 'active' && s.group.status === 'active' && s.nextBillingDate)
    .map(s => ({ ...s, days: Math.ceil((new Date(s.nextBillingDate).getTime() - Date.now()) / 86400000) }))
    .filter(s => s.days >= 0 && s.days <= 7)
  if (candidates.length === 0) return

  // MySQL 的 Prisma JSON filter 不支援 path + in 併用，改為抓出該使用者所有 upcoming_renewal 通知後在記憶體中比對
  const alreadySent = await prisma.notification.findMany({
    where: { userId, type: 'upcoming_renewal' },
    orderBy: { createdAt: 'desc' },
  })
  const alreadySentByGroupId = new Map()
  for (const n of alreadySent) {
    const groupId = n.meta?.groupId
    // 已依 createdAt desc 排序，只在第一次遇到該 groupId 時寫入，確保保留最新一筆
    if (groupId && !alreadySentByGroupId.has(groupId)) alreadySentByGroupId.set(groupId, n)
  }

  const toCreate = candidates.filter(sub => {
    const sent = alreadySentByGroupId.get(sub.groupId)
    return sent?.meta?.nextBillingDate !== sub.nextBillingDate.toISOString()
  })
  if (toCreate.length === 0) return

  await prisma.notification.createMany({
    data: toCreate.map(sub => ({
      userId,
      type:    'upcoming_renewal',
      title:   '即將續訂',
      message: `「${sub.group.service?.name ?? sub.group.planName}」將於 ${sub.days === 0 ? '今天' : `${sub.days} 天後`}扣款，請確認PM幣餘額充足。`,
      meta:    { groupId: sub.groupId, nextBillingDate: sub.nextBillingDate.toISOString() },
    })),
  }).catch(console.error)
}

// GET /subscriptions?groupId= — 回傳自己的訂閱，或自己主持群組內的所有訂閱
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.query
    const scope = {
      OR: [
        { userId: req.user.id },
        { group: { hostId: req.user.id } },
      ],
    }
    const subscriptions = await prisma.subscription.findMany({
      where: groupId ? { AND: [scope, { groupId }] } : scope,
      include: {
        group: { include: { service: true, host: { select: { id: true, name: true } } } },
        user:  { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    notifyUpcomingRenewals(subscriptions, req.user.id).catch(console.error)
    res.json(subscriptions)
  } catch (err) { next(err) }
})

// DELETE /subscriptions/:id — 訂閱本人或該群組團主可刪除
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where:   { id: req.params.id },
      include: { group: { select: { hostId: true } } },
    })
    if (!sub) return res.status(404).json({ message: '訂閱不存在' })

    const isOwner = sub.userId === req.user.id
    const isHost  = sub.group.hostId === req.user.id
    if (!isOwner && !isHost) return res.status(403).json({ message: '無操作權限' })

    await prisma.subscription.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

// PATCH /subscriptions/:id — 成員標記付款 or 團主確認
router.patch('/:id', requireAuth, validate(updateSubscriptionSchema), async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { group: true },
    })
    if (!sub) return res.status(404).json({ message: '訂閱不存在' })

    const isOwner = sub.userId === req.user.id
    const isHost  = sub.group.hostId === req.user.id
    if (!isOwner && !isHost) return res.status(403).json({ message: '無操作權限' })

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data:  req.body,
    })
    res.json(updated)
  } catch (err) { next(err) }
})

export default router
