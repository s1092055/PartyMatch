import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

const MONTHLY_FEE = 300

describe('申請加入的邊界情況', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('PM幣餘額不足時申請被拒絕，不會扣款、不會建立申請', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const member = await createUser({ tokenBalance: MONTHLY_FEE - 1, name: '窮成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE })

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE')

    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance)
      .toBe(MONTHLY_FEE - 1)
    expect(await prisma.application.findFirst({ where: { groupId: group.id, userId: member.id } }))
      .toBeNull()
  })

  it('同一群組已有一筆進行中的申請時，重複申請被拒絕', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const member = await createUser({ tokenBalance: 2000, name: '成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE })
    const memberAuth = authHeader(member)

    const first = await request(app)
      .post('/api/applications')
      .set('Authorization', memberAuth)
      .send({ groupId: group.id })
    expect(first.status).toBe(201)

    const second = await request(app)
      .post('/api/applications')
      .set('Authorization', memberAuth)
      .send({ groupId: group.id })
    expect(second.status).toBe(409)

    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance)
      .toBe(2000 - MONTHLY_FEE);
    const applications = await prisma.application.findMany({ where: { groupId: group.id, userId: member.id } })
    expect(applications).toHaveLength(1)
  })

  it('申請人自行取消申請，代管退款、狀態轉 cancelled', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const member = await createUser({ tokenBalance: 1000, name: '成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE })
    const memberAuth = authHeader(member)

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', memberAuth)
      .send({ groupId: group.id })

    const cancelRes = await request(app)
      .delete(`/api/applications/${applyRes.body.id}`)
      .set('Authorization', memberAuth)
    expect(cancelRes.status).toBe(200)
    expect(cancelRes.body.status).toBe('cancelled')

    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(1000)
    expect((await prisma.group.findUnique({ where: { id: group.id } })).escrowTokens).toBe(0)
    const refundTx = await prisma.tokenTransaction.findFirst({
      where: { userId: member.id, relatedGroupId: group.id, type: 'refund' },
    })
    expect(refundTx?.amount).toBe(MONTHLY_FEE)
  })

  it('團主拒絕申請，代管退款、狀態轉 rejected', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const member = await createUser({ tokenBalance: 1000, name: '成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE })

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id })

    const rejectRes = await request(app)
      .patch(`/api/applications/${applyRes.body.id}`)
      .set('Authorization', authHeader(host))
      .send({ status: 'rejected' })
    expect(rejectRes.status).toBe(200)
    expect(rejectRes.body.status).toBe('rejected')

    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(1000)
    expect((await prisma.group.findUnique({ where: { id: group.id } })).escrowTokens).toBe(0)
  })
})
