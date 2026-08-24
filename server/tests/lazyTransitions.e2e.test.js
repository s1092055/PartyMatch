import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'
import { advanceToConfirming } from './helpers/flows.js'

const MONTHLY_FEE = 300

describe('GET /groups/:id 的惰性自動狀態轉換', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('confirming 且 confirmDeadline 已過期：打開群組詳情時自動撥款給團主', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const member = await createUser({ tokenBalance: 1000, name: '成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })
    await advanceToConfirming({ host, member, group })

    await prisma.group.update({
      where: { id: group.id },
      data:  { confirmDeadline: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .get(`/api/groups/${group.id}`)
      .set('Authorization', authHeader(member))
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('active')
    expect(res.body.escrowTokens).toBe(0)

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('active')
    expect((await prisma.user.findUnique({ where: { id: host.id } })).tokenBalance).toBe(MONTHLY_FEE)

    const releaseTx = await prisma.tokenTransaction.findFirst({
      where: { userId: host.id, relatedGroupId: group.id, type: 'release' },
    })
    expect(releaseTx?.amount).toBe(MONTHLY_FEE)
  })

  it('pending_confirmation 且 serviceInfoDeadline 已過期：逾期未填寫的成員自動被移出並退款，群組回 recruiting', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const member = await createUser({ tokenBalance: 1000, name: '拖延的成員' })
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

    await prisma.group.update({
      where: { id: group.id },
      data:  { serviceInfoDeadline: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .get(`/api/groups/${group.id}`)
      .set('Authorization', authHeader(host))
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('recruiting')

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('recruiting')
    expect(groupState.currentMembers).toBe(0)
    expect(groupState.escrowTokens).toBe(0)

    expect(await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })).toBeNull()
    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(1000)

    const application = await prisma.application.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(application.status).toBe('removed')

    const refundTx = await prisma.tokenTransaction.findFirst({
      where: { userId: member.id, relatedGroupId: group.id, type: 'refund' },
    })
    expect(refundTx?.amount).toBe(MONTHLY_FEE)
  })
});
