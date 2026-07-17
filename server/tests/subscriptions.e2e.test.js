import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

async function createSubscription(group, user, overrides = {}) {
  return prisma.subscription.create({
    data: { groupId: group.id, userId: user.id, status: 'active', ...overrides },
  })
}

describe('訂閱（GET/PATCH/DELETE /subscriptions）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('GET /subscriptions 回傳自己是訂閱者或是團主的訂閱，不會看到跟自己無關的', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const stranger = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })
    await createSubscription(group, member)

    const asMember = await request(app).get('/api/subscriptions').set('Authorization', authHeader(member))
    expect(asMember.status).toBe(200)
    expect(asMember.body).toHaveLength(1)

    const asHost = await request(app).get('/api/subscriptions').set('Authorization', authHeader(host))
    expect(asHost.status).toBe(200)
    expect(asHost.body).toHaveLength(1)

    const asStranger = await request(app).get('/api/subscriptions').set('Authorization', authHeader(stranger))
    expect(asStranger.status).toBe(200)
    expect(asStranger.body).toHaveLength(0)
  })

  it('GET /subscriptions?groupId= 只回傳該群組相關的訂閱', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group: groupA } = await createGroup({ host })
    const { group: groupB } = await createGroup({ host })
    await createSubscription(groupA, member)
    await createSubscription(groupB, member)

    const res = await request(app).get(`/api/subscriptions?groupId=${groupA.id}`).set('Authorization', authHeader(member))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].groupId).toBe(groupA.id)
  })

  it('訂閱者本人可以 PATCH 更新狀態', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    const sub = await createSubscription(group, member, { status: 'pending' })

    const res = await request(app)
      .patch(`/api/subscriptions/${sub.id}`)
      .set('Authorization', authHeader(member))
      .send({ status: 'active' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('active')
  })

  it('無關的第三人不能 PATCH 別人的訂閱（403）', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const stranger = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })
    const sub = await createSubscription(group, member)

    const res = await request(app)
      .patch(`/api/subscriptions/${sub.id}`)
      .set('Authorization', authHeader(stranger))
      .send({ status: 'ended' })
    expect(res.status).toBe(403)
  })

  it('訂閱不存在回 404', async () => {
    const user = await createUser()
    const res = await request(app)
      .patch('/api/subscriptions/does-not-exist')
      .set('Authorization', authHeader(user))
      .send({ status: 'ended' })
    expect(res.status).toBe(404)
  })

  it('團主可以刪除訂閱', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    const sub = await createSubscription(group, member)

    const res = await request(app).delete(`/api/subscriptions/${sub.id}`).set('Authorization', authHeader(host))
    expect(res.status).toBe(204)
    expect(await prisma.subscription.findUnique({ where: { id: sub.id } })).toBeNull()
  })

  it('無關的第三人不能刪除別人的訂閱（403）', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const stranger = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })
    const sub = await createSubscription(group, member)

    const res = await request(app).delete(`/api/subscriptions/${sub.id}`).set('Authorization', authHeader(stranger))
    expect(res.status).toBe(403)
    expect(await prisma.subscription.findUnique({ where: { id: sub.id } })).not.toBeNull()
  })

  it('未登入呼叫任何端點都回 401', async () => {
    expect((await request(app).get('/api/subscriptions')).status).toBe(401)
    expect((await request(app).patch('/api/subscriptions/x').send({ status: 'ended' })).status).toBe(401)
    expect((await request(app).delete('/api/subscriptions/x')).status).toBe(401)
  })
})
