import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { appendMessage, isSystemConversation, parseParticipants } from '../lib/conversationMessages.js'
import { maskAvatar } from '../lib/avatarVisibility.js'

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
    const rawConversations = await prisma.conversation.findMany({
      where:   { participants: { array_contains: req.user.id } },
      include: { group: { select: { id: true, planName: true, hostId: true, service: { select: { id: true, name: true } } } } },
      orderBy: { updatedAt: 'desc' },
    })

    // DM 在雙方都還沒送出過任何訊息前，不列給任何一方看到（lastMessage 為 null 代表還沒有任何訊息）：
    // 發起人自己按了「聯絡」但反悔沒打字就關掉，下次打開訊息中心不該再看到這個空聊天室；
    // 對方也要等發起人真的送出第一則訊息才會看到聊天室出現。群組聊天室不受影響（鎖定群組建立聊天室
    // 當下就會發一則系統訊息，不會有「已建立但沒有任何訊息」的空窗期）
    const conversations = rawConversations.filter(c => c.type !== 'dm' || c.lastMessage != null)

    // 為 DM 對話補上參與者 meta（name / avatarInitial / avatarColor）
    const allParticipantIds = [...new Set(conversations.flatMap(parseParticipants))]
    const users = allParticipantIds.length
      ? await prisma.user.findMany({
          where:  { id: { in: allParticipantIds } },
          select: { id: true, name: true, avatarInitial: true, avatarColor: true, showAvatar: true, presenceStatus: true },
        })
      : []
    const userMap = Object.fromEntries(users.map(u => [u.id, maskAvatar(u)]))

    const enriched = conversations.map(c => {
      const participantMeta = Object.fromEntries(parseParticipants(c).map(id => [id, userMap[id] ?? {}]))
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

    const existing = await prisma.conversation.findFirst({
      where: { type: 'group', groupId },
    })
    if (existing) return res.json(existing)

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
        data: { type: 'dm', participants, initiatorId: req.user.id },
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
    const participants = parseParticipants(conversation)
    if (!participants.includes(req.user.id)) {
      return res.status(403).json({ message: '無讀取權限' })
    }

    const { cursor, limit = '50' } = req.query
    const messages = await prisma.message.findMany({
      where:   { conversationId: req.params.id, ...(cursor && { createdAt: { lt: new Date(cursor) } }) },
      include: { sender: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true } } },
      orderBy: { createdAt: 'desc' },
      take:    parseInt(limit),
    })
    res.json(messages.reverse().map(m => ({ ...m, sender: maskAvatar(m.sender) })))
  } catch (err) { next(err) }
})

// POST /conversations/:id/messages
router.post('/:id/messages', requireAuth, validate(sendMessageSchema), async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } })
    if (!conversation) return res.status(404).json({ message: '對話不存在' })
    if (isSystemConversation(conversation)) {
      return res.status(403).json({ message: '系統通知無法回覆' })
    }
    const participants = parseParticipants(conversation)
    if (!participants.includes(req.user.id)) {
      return res.status(403).json({ message: '無發送權限' })
    }

    const { content, type, actionType, payload } = req.body
    const message = await appendMessage(conversation, {
      senderId: req.user.id, content, type, actionType, payload, participants,
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
    if (isSystemConversation(conversation)) {
      return res.status(403).json({ message: '系統聊天室不可變更參與者' })
    }

    const participants = [...parseParticipants(conversation)]

    if (action === 'add') {
      // 只有已在對話中的人，或該群組對話的團主，可以把人加進來，避免任意使用者把自己塞進不相關的對話
      const isParticipant = participants.includes(req.user.id)
      const isGroupHost = conversation.type === 'group' && conversation.groupId
        ? (await prisma.group.findUnique({ where: { id: conversation.groupId }, select: { hostId: true } }))?.hostId === req.user.id
        : false
      if (!isParticipant && !isGroupHost) {
        return res.status(403).json({ message: '無權限加入此對話' })
      }
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
