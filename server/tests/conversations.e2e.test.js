import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

async function addMember(group, user) {
  return prisma.member.create({ data: { groupId: group.id, userId: user.id } })
}

describe('群組聊天室（POST /conversations/group, GET /:id/messages, POST /:id/messages）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('團主可以建立群組聊天室，成員會被列入 participants', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)

    const res = await request(app)
      .post('/api/conversations/group')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id })
    expect(res.status).toBe(201)
    expect(res.body.participants.sort()).toEqual([host.id, member.id].sort())
  })

  it('非團主不能建立群組聊天室（403）', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)

    const res = await request(app)
      .post('/api/conversations/group')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id })
    expect(res.status).toBe(403)
  })

  it('重複建立同一群組的聊天室會回傳既有的那個，不會建立第二個', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })

    const first = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })
    const second = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })
    expect(second.status).toBe(200)
    expect(second.body.id).toBe(first.body.id)
    expect(await prisma.conversation.count({ where: { type: 'group', groupId: group.id } })).toBe(1)
  })

  it('聊天室參與者可以送訊息，並在 GET messages 看到', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })
    const created = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })

    const send = await request(app)
      .post(`/api/conversations/${created.body.id}/messages`)
      .set('Authorization', authHeader(host))
      .send({ content: '大家好' })
    expect(send.status).toBe(201)

    const list = await request(app).get(`/api/conversations/${created.body.id}/messages`).set('Authorization', authHeader(host))
    expect(list.status).toBe(200)
    expect(list.body.map(m => m.content)).toContain('大家好')
  })

  it('非參與者不能讀取或送訊息（403）', async () => {
    const host = await createUser({ name: '團主' })
    const stranger = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })
    const created = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })

    const read = await request(app).get(`/api/conversations/${created.body.id}/messages`).set('Authorization', authHeader(stranger))
    expect(read.status).toBe(403)

    const send = await request(app).post(`/api/conversations/${created.body.id}/messages`).set('Authorization', authHeader(stranger)).send({ content: 'hi' })
    expect(send.status).toBe(403)
  })

  it('內容與附件都空白的訊息會被 zod 擋下', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })
    const created = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })

    const res = await request(app).post(`/api/conversations/${created.body.id}/messages`).set('Authorization', authHeader(host)).send({ content: '' })
    expect(res.status).toBe(400)
  })

  it('GET /conversations 只列出自己有參與的對話', async () => {
    const host = await createUser({ name: '團主' })
    const stranger = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })
    await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })

    const res = await request(app).get('/api/conversations').set('Authorization', authHeader(stranger))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

describe('私訊（POST /conversations/dm）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('對同一個人重複發起 DM 會回傳同一個對話', async () => {
    const a = await createUser({ name: 'A' })
    const b = await createUser({ name: 'B' })

    const first = await request(app).post('/api/conversations/dm').set('Authorization', authHeader(a)).send({ targetUserId: b.id })
    const second = await request(app).post('/api/conversations/dm').set('Authorization', authHeader(b)).send({ targetUserId: a.id })
    expect(first.status).toBe(200)
    expect(second.body.id).toBe(first.body.id)
  })
})

describe('對話已讀 / 參與者管理（PATCH /:id/read, /:id/participants）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('PATCH /:id/read 會清掉自己的未讀數並記錄已讀時間', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })
    const created = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })
    await prisma.conversation.update({ where: { id: created.body.id }, data: { unreadCounts: { [host.id]: 3 } } })

    const res = await request(app).patch(`/api/conversations/${created.body.id}/read`).set('Authorization', authHeader(host))
    expect(res.status).toBe(200)
    const updated = await prisma.conversation.findUnique({ where: { id: created.body.id } })
    expect(updated.unreadCounts[host.id]).toBeUndefined()
    expect(updated.lastReadAt[host.id]).toBeTruthy()
  })

  it('團主可以把成員移出群組聊天室（action: remove）', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)
    const created = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })

    const res = await request(app)
      .patch(`/api/conversations/${created.body.id}/participants`)
      .set('Authorization', authHeader(host))
      .send({ action: 'remove', userId: member.id })
    expect(res.status).toBe(200)
    expect(res.body.participants).not.toContain(member.id)
  })

  it('非團主不能移除群組聊天室的成員（403）', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)
    const created = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })

    const res = await request(app)
      .patch(`/api/conversations/${created.body.id}/participants`)
      .set('Authorization', authHeader(member))
      .send({ action: 'remove', userId: host.id })
    expect(res.status).toBe(403)
  })

  it('action 不合法回 400', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })
    const created = await request(app).post('/api/conversations/group').set('Authorization', authHeader(host)).send({ groupId: group.id })

    const res = await request(app)
      .patch(`/api/conversations/${created.body.id}/participants`)
      .set('Authorization', authHeader(host))
      .send({ action: 'not-a-real-action' })
    expect(res.status).toBe(400)
  })
})
