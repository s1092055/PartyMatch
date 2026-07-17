import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

const MONTHLY_FEE = 300

describe('解散群組', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('解散時退款給已核准成員，也退款給還在審核中的申請人', async () => {
    const host = await createUser({ tokenBalance: 0, name: '團主' });
    const approvedMember = await createUser({ tokenBalance: 1000, name: '已核准成員' })
    const pendingApplicant = await createUser({ tokenBalance: 1000, name: '審核中申請人' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 3 })

    const applyApproved = await request(app)
      .post('/api/applications')
      .set('Authorization', authHeader(approvedMember))
      .send({ groupId: group.id })
    await request(app)
      .patch(`/api/applications/${applyApproved.body.id}`)
      .set('Authorization', authHeader(host))
      .send({ status: 'approved' })

    const applyPending = await request(app)
      .post('/api/applications')
      .set('Authorization', authHeader(pendingApplicant))
      .send({ groupId: group.id })

    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('recruiting');

    const cancelRes = await request(app)
      .post(`/api/groups/${group.id}/cancel`)
      .set('Authorization', authHeader(host))
    expect(cancelRes.status).toBe(200)
    expect(cancelRes.body.status).toBe('cancelled')

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('cancelled')
    expect(groupState.escrowTokens).toBe(0)

    expect((await prisma.user.findUnique({ where: { id: approvedMember.id } })).tokenBalance).toBe(1000)
    expect((await prisma.user.findUnique({ where: { id: pendingApplicant.id } })).tokenBalance).toBe(1000)

    expect((await prisma.application.findUnique({ where: { id: applyPending.body.id } })).status)
      .toBe('rejected')
  })

  it('群組已鎖定（非 recruiting/full）無法解散', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const member = await createUser({ tokenBalance: 1000, name: '成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id })
    await request(app)
      .patch(`/api/applications/${applyRes.body.id}`)
      .set('Authorization', authHeader(host))
      .send({ status: 'approved' })
    await request(app)
      .post(`/api/groups/${group.id}/lock`)
      .set('Authorization', authHeader(host))
      .send({})

    const res = await request(app)
      .post(`/api/groups/${group.id}/cancel`)
      .set('Authorization', authHeader(host))
    expect(res.status).toBe(400)
  })
})
