import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const sendMessageSchema = z.object({
  content:    z.string().min(1).max(2000),
  type:       z.enum(['text', 'system', 'action']).default('text'),
  actionType: z.string().optional(),
  payload:    z.record(z.unknown()).optional(),
})

const dmSchema = z.object({
  targetUserId: z.string().min(1),
})

// GET /conversations — 我的所有對話（含群組服務資訊與 DM 參與者資訊）
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where:   { participants: { array_contains: req.user.id } },
      include: { group: { select: { id: true, planName: true, hostId: true, service: { select: { id: true, name: true } } } } },
      orderBy: { updatedAt: 'desc' },
    })

    // 為 DM 對話補上參與者 meta（name / avatarInitial / avatarColor）
    const allParticipantIds = [...new Set(
      conversations.flatMap(c => {
        const ids = Array.isArray(c.participants) ? c.participants : JSON.parse(c.participants ?? '[]')
        return ids
      })
    )]
    const users = allParticipantIds.length
      ? await prisma.user.findMany({
          where:  { id: { in: allParticipantIds } },
          select: { id: true, name: true, avatarInitial: true, avatarColor: true },
        })
      : []
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))

    const enriched = conversations.map(c => {
      const ids = Array.isArray(c.participants) ? c.participants : JSON.parse(c.participants ?? '[]')
      const participantMeta = Object.fromEntries(ids.map(id => [id, userMap[id] ?? {}]))
      return { ...c, participantMeta }
    })

    res.json(enriched)
  } catch (err) { next(err) }
})

// POST /conversations/group — 建立或取得群組聊天室
router.post('/group', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.body
    if (!groupId) return res.status(400).json({ message: 'groupId 為必填' })

    const group = await prisma.group.findUnique({
      where:   { id: groupId },
      include: { members: { select: { userId: true } } },
    })
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可建立聊天室' })

    // 若已存在則直接回傳
    const existing = await prisma.conversation.findFirst({
      where: { type: 'group', groupId },
    })
    if (existing) return res.json(existing)

    // 聊天室成員 = 團主 + 所有 member
    const participantIds = [...new Set([group.hostId, ...group.members.map(m => m.userId)])]
    const conversation = await prisma.conversation.create({
      data: { type: 'group', groupId, participants: participantIds },
    })
    res.status(201).json(conversation)
  } catch (err) { next(err) }
})

// POST /conversations/dm — 建立或取得 DM
router.post('/dm', requireAuth, validate(dmSchema), async (req, res, next) => {
  try {
    const { targetUserId } = req.body
    const participants = [req.user.id, targetUserId].sort()

    let conversation = await prisma.conversation.findFirst({
      where: { type: 'dm', participants: { equals: participants } },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { type: 'dm', participants },
      })
    }

    res.json(conversation)
  } catch (err) { next(err) }
})

// GET /conversations/:id/messages
router.get('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } })
    if (!conversation) return res.status(404).json({ message: '對話不存在' })
    const participants = Array.isArray(conversation.participants)
      ? conversation.participants
      : JSON.parse(conversation.participants ?? '[]')
    if (!participants.includes(req.user.id)) {
      return res.status(403).json({ message: '無讀取權限' })
    }

    const { cursor, limit = '50' } = req.query
    const messages = await prisma.message.findMany({
      where:   { conversationId: req.params.id, ...(cursor && { createdAt: { lt: new Date(cursor) } }) },
      include: { sender: { select: { id: true, name: true, avatarColor: true, avatarInitial: true } } },
      orderBy: { createdAt: 'desc' },
      take:    parseInt(limit),
    })
    res.json(messages.reverse())
  } catch (err) { next(err) }
})

// POST /conversations/:id/messages
router.post('/:id/messages', requireAuth, validate(sendMessageSchema), async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } })
    if (!conversation) return res.status(404).json({ message: '對話不存在' })
    const participants2 = Array.isArray(conversation.participants)
      ? conversation.participants
      : JSON.parse(conversation.participants ?? '[]')
    if (!participants2.includes(req.user.id)) {
      return res.status(403).json({ message: '無發送權限' })
    }

    const { content, type, actionType, payload } = req.body
    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        senderId: req.user.id,
        content,
        type,
        ...(actionType !== undefined && { actionType }),
        ...(payload    !== undefined && { payload }),
      },
      include: { sender: { select: { id: true, name: true, avatarColor: true, avatarInitial: true } } },
    })

    // 更新 lastMessage + 未讀數
    const unreadCounts = { ...(conversation.unreadCounts ?? {}) }
    for (const uid of participants2) {
      if (uid !== req.user.id) {
        unreadCounts[uid] = (unreadCounts[uid] ?? 0) + 1
      }
    }
    await prisma.conversation.update({
      where: { id: req.params.id },
      data:  {
        lastMessage: { content, senderId: req.user.id, createdAt: message.createdAt },
        unreadCounts,
        updatedAt: new Date(),
      },
    })

    res.status(201).json(message)
  } catch (err) { next(err) }
})

// PATCH /conversations/:id/participants — 加入或退出對話
router.patch('/:id/participants', requireAuth, async (req, res, next) => {
  try {
    const { action, userId } = req.body
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } })
    if (!conversation) return res.status(404).json({ message: '對話不存在' })

    const participants = Array.isArray(conversation.participants)
      ? [...conversation.participants]
      : JSON.parse(conversation.participants ?? '[]')

    if (action === 'add') {
      const targetId = userId ?? req.user.id
      if (!participants.includes(targetId)) participants.push(targetId)
    } else if (action === 'leave') {
      const idx = participants.indexOf(req.user.id)
      if (idx !== -1) participants.splice(idx, 1)
    } else if (action === 'remove') {
      // 僅群組對話的團主可移除特定成員
      if (conversation.type !== 'group') return res.status(400).json({ message: '僅群組聊天室可移除成員' })
      const group = conversation.groupId
        ? await prisma.group.findUnique({ where: { id: conversation.groupId }, select: { hostId: true } })
        : null
      if (!group || group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可移除成員' })
      if (!userId) return res.status(400).json({ message: '缺少 userId' })
      const idx = participants.indexOf(userId)
      if (idx !== -1) participants.splice(idx, 1)
    } else {
      return res.status(400).json({ message: 'action 必須為 add、leave 或 remove' })
    }

    const updated = await prisma.conversation.update({
      where: { id: req.params.id },
      data:  { participants },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

// PATCH /conversations/:id/read — 標記已讀
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } })
    if (!conversation) return res.status(404).json({ message: '對話不存在' })

    const unreadCounts = { ...(conversation.unreadCounts ?? {}) }
    delete unreadCounts[req.user.id]
    const lastReadAt = { ...(conversation.lastReadAt ?? {}), [req.user.id]: new Date().toISOString() }

    await prisma.conversation.update({
      where: { id: req.params.id },
      data:  { unreadCounts, lastReadAt },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
