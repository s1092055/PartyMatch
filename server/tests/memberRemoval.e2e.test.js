import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

const MONTHLY_FEE = 300

async function setupApprovedMember({ maxMembers = 3 } = {}) {
  const host   = await createUser({ tokenBalance: 0, name: '團主' })
  const member = await createUser({ tokenBalance: 1000, name: '成員' })
  const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers })

  const applyRes = await request(app)
    .post('/api/applications')
    .set('Authorization', authHeader(member))
    .send({ groupId: group.id })

  await request(app)
    .patch(`/api/applications/${applyRes.body.id}`)
    .set('Authorization', authHeader(host))
    .send({ status: 'approved' })

  const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
  return { host, member, group, memberRecord }
}

describe('成員移除／自行退出', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('團主移除成員：退款、不扣信用分數、群組狀態從 full 退回 recruiting', async () => {
    const { host, member, group, memberRecord } = await setupApprovedMember({ maxMembers: 2 });
    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('full')

    const res = await request(app)
      .delete(`/api/members/${memberRecord.id}`)
      .set('Authorization', authHeader(host))
    expect(res.status).toBe(200)
    expect(res.body.currentMembers).toBe(0)

    expect((await prisma.member.findUnique({ where: { id: memberRecord.id } }))).toBeNull()
    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('recruiting')
    expect((await prisma.group.findUnique({ where: { id: group.id } })).escrowTokens).toBe(0)
    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(1000)
    expect((await prisma.user.findUnique({ where: { id: member.id } })).creditScore).toBe(100);

    const application = await prisma.application.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(application.status).toBe('removed')

    const refundTx = await prisma.tokenTransaction.findFirst({
      where: { userId: member.id, relatedGroupId: group.id, type: 'refund' },
    })
    expect(refundTx?.amount).toBe(MONTHLY_FEE)
  })

  it('成員自行退出：退款、不扣信用分數', async () => {
    const { member, group, memberRecord } = await setupApprovedMember({ maxMembers: 3 })

    const res = await request(app)
      .delete(`/api/members/${memberRecord.id}`)
      .set('Authorization', authHeader(member))
    expect(res.status).toBe(200)

    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(1000)
    expect((await prisma.user.findUnique({ where: { id: member.id } })).creditScore).toBe(100);

    const application = await prisma.application.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(application.status).toBe('left')
  })

  it('群組鎖定後無法再變動成員名單', async () => {
    const { host, group, memberRecord } = await setupApprovedMember({ maxMembers: 2 })

    const lockRes = await request(app)
      .post(`/api/groups/${group.id}/lock`)
      .set('Authorization', authHeader(host))
      .send({})
    expect(lockRes.status).toBe(200)

    const res = await request(app)
      .delete(`/api/members/${memberRecord.id}`)
      .set('Authorization', authHeader(host))
    expect(res.status).toBe(400)
  })
})
