import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { resetDb } from './helpers/db.js'
import prisma from '../src/lib/prisma.js'
import { createUser, createAdminUser, createGroup, authHeader, adminAuthHeader } from './helpers/factories.js'
import { advanceToConfirming } from './helpers/flows.js'

const MONTHLY_FEE = 300

async function setupConfirming() {
  const host   = await createUser({ tokenBalance: 0, name: '團主' })
  const member = await createUser({ tokenBalance: 1000, name: '成員' })
  const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })
  await advanceToConfirming({ host, member, group })
  return { host, member, group }
}

async function raiseDispute({ group, member }) {
  return request(app)
    .post(`/api/groups/${group.id}/dispute`)
    .set('Authorization', authHeader(member))
    .send({ reason: '帳號密碼登不進去', evidenceUrl: 'https://example.com/screenshot.png' })
}

describe('管理員後台（GET /admin/stats）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('管理員可以看到統計數字', async () => {
    const admin = await createAdminUser()
    const host = await createUser()
    await createGroup({ host })

    const res = await request(app).get('/api/admin/stats').set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(200)
    expect(res.body.totalGroups).toBeGreaterThanOrEqual(1)
    expect(res.body.groupStatusCounts).toBeTypeOf('object')
  })

  it('一般使用者的 token 無法通過管理員驗證（401，因為簽章金鑰完全不同）', async () => {
    const user = await createUser()
    const res = await request(app).get('/api/admin/stats').set('Authorization', authHeader(user))
    expect(res.status).toBe(401)
  })

  it('未登入回 401', async () => {
    const res = await request(app).get('/api/admin/stats')
    expect(res.status).toBe(401)
  })
})

describe('管理員後台（GET /admin/disputes）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('預設列出待審申訴（pending）', async () => {
    const admin = await createAdminUser()
    const { member, group } = await setupConfirming()
    await raiseDispute({ group, member })

    const res = await request(app).get('/api/admin/disputes').set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].groupId).toBe(group.id)
    expect(res.body[0].status).toBe('pending')
  })

  it('GET /admin/disputes/history 只列出已解決的申訴', async () => {
    const admin = await createAdminUser()
    const { member, group } = await setupConfirming()
    await raiseDispute({ group, member })
    const memberId = (await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })).id
    await request(app)
      .post(`/api/groups/${group.id}/adjudicate`)
      .set('Authorization', adminAuthHeader(admin))
      .send({ memberId, winner: 'member', reason: '確認團主提供的帳密有問題' })

    const pending = await request(app).get('/api/admin/disputes').set('Authorization', adminAuthHeader(admin))
    expect(pending.body).toHaveLength(0)

    const history = await request(app).get('/api/admin/disputes/history').set('Authorization', adminAuthHeader(admin))
    expect(history.status).toBe(200)
    expect(history.body).toHaveLength(1)
    expect(history.body[0].resolutionType).toBe('member_wins')
  })

  it('GET /admin/disputes/:id 回傳完整詳情（含留言、聊天室訊息、seatCost）', async () => {
    const admin = await createAdminUser()
    const { member, group } = await setupConfirming()
    await raiseDispute({ group, member })

    const list = await request(app).get('/api/admin/disputes').set('Authorization', adminAuthHeader(admin))
    const disputeId = list.body[0].id

    const res = await request(app).get(`/api/admin/disputes/${disputeId}`).set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(200)
    expect(res.body.groupId).toBe(group.id)
    expect(res.body.seatCost).toBe(MONTHLY_FEE)
    expect(Array.isArray(res.body.credentialComments)).toBe(true)
    expect(Array.isArray(res.body.conversationMessages)).toBe(true)
  })

  it('找不到申訴回 404', async () => {
    const admin = await createAdminUser()
    const res = await request(app).get('/api/admin/disputes/does-not-exist').set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(404)
  })

  it('一般使用者的 token 無法查詢申訴清單（401）', async () => {
    const user = await createUser()
    const res = await request(app).get('/api/admin/disputes').set('Authorization', authHeader(user))
    expect(res.status).toBe(401)
  })
})
