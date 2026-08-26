import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, authHeader } from './helpers/factories.js'

describe('系統訊息（POST /system-messages/broadcast, /direct，管理員限定）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('管理員可以廣播訊息給所有使用者（不含系統帳號自己）', async () => {
    const admin = await createUser({ isAdmin: true })
    await createUser({ name: '使用者A' })
    await createUser({ name: '使用者B' })

    const res = await request(app)
      .post('/api/system-messages/broadcast')
      .set('Authorization', authHeader(admin))
      .send({ content: '系統維護公告' })
    expect(res.status).toBe(201)
    expect(res.body.sent).toBe(3) // admin + 使用者A + 使用者B（不含系統帳號自己）
  })

  it('非管理員廣播回 403', async () => {
    const user = await createUser()
    const res = await request(app)
      .post('/api/system-messages/broadcast')
      .set('Authorization', authHeader(user))
      .send({ content: '嘗試廣播' })
    expect(res.status).toBe(403)
  })

  it('管理員可以對單一使用者發送系統訊息', async () => {
    const admin = await createUser({ isAdmin: true })
    const target = await createUser({ name: '目標使用者' })

    const res = await request(app)
      .post('/api/system-messages/direct')
      .set('Authorization', authHeader(admin))
      .send({ userId: target.id, content: '單獨通知你一件事' })
    expect(res.status).toBe(201)

    const conversation = await prisma.conversation.findFirst({ where: { type: 'system', participants: { array_contains: target.id } } })
    expect(conversation).not.toBeNull()
    const messages = await prisma.message.findMany({ where: { conversationId: conversation.id } })
    expect(messages.some(m => m.content === '單獨通知你一件事')).toBe(true)
  })

  it('內容為空字串會被 zod 擋下', async () => {
    const admin = await createUser({ isAdmin: true })
    const res = await request(app)
      .post('/api/system-messages/broadcast')
      .set('Authorization', authHeader(admin))
      .send({ content: '' })
    expect(res.status).toBe(400)
  })

  it('未登入呼叫回 401', async () => {
    const res = await request(app).post('/api/system-messages/broadcast').send({ content: 'x' })
    expect(res.status).toBe(401)
  })
})
