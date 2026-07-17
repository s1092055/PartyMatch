import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

const MONTHLY_FEE = 300

describe('群組生命週期：apply → approve → lock → 填寫服務帳號 → activate → confirm → release', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('每一步的狀態機轉換與 PM 幣帳務都正確', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' });
    const member = await createUser({ tokenBalance: 1000, name: '成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })

    const hostAuth   = authHeader(host)
    const memberAuth = authHeader(member)

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', memberAuth)
      .send({ groupId: group.id });
    expect(applyRes.status).toBe(201)
    const applicationId = applyRes.body.id
    expect(applyRes.body.escrowAmount).toBe(MONTHLY_FEE)

    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance)
      .toBe(1000 - MONTHLY_FEE)
    expect((await prisma.group.findUnique({ where: { id: group.id } })).escrowTokens)
      .toBe(MONTHLY_FEE)
    const applyTx = await prisma.tokenTransaction.findFirst({
      where: { userId: member.id, relatedGroupId: group.id, type: 'escrow' },
    })
    expect(applyTx?.amount).toBe(-MONTHLY_FEE)

    const approveRes = await request(app)
      .patch(`/api/applications/${applicationId}`)
      .set('Authorization', hostAuth)
      .send({ status: 'approved' });
    expect(approveRes.status).toBe(200)
    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('full')

    const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(memberRecord).toBeTruthy()
    expect((await prisma.subscription.findFirst({ where: { groupId: group.id, userId: member.id } }))).toBeTruthy()

    const lockRes = await request(app)
      .post(`/api/groups/${group.id}/lock`)
      .set('Authorization', hostAuth)
      .send({});
    expect(lockRes.status).toBe(200)
    let groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('pending_confirmation')
    expect(groupState.nextBillingDate).toBeTruthy()
    expect(groupState.serviceInfoDeadline).toBeTruthy()

    const fillRes = await request(app)
      .patch(`/api/members/${memberRecord.id}`)
      .set('Authorization', memberAuth)
      .send({ serviceInfo: { account: 'test@example.com', password: 'secret' } });
    expect(fillRes.status).toBe(200)
    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('pending_activation')

    const activateRes = await request(app)
      .post(`/api/groups/${group.id}/activate`)
      .set('Authorization', hostAuth)
      .send({});
    expect(activateRes.status).toBe(200)
    groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('confirming')
    expect((await prisma.member.findUnique({ where: { id: memberRecord.id } })).confirmDeadline).toBeTruthy()

    const confirmRes = await request(app)
      .post(`/api/groups/${group.id}/confirm`)
      .set('Authorization', memberAuth)
      .send({});
    expect(confirmRes.status).toBe(200)
    expect(confirmRes.body.released).toBe(true)

    groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('active')
    expect(groupState.escrowTokens).toBe(0)

    expect((await prisma.user.findUnique({ where: { id: host.id } })).tokenBalance)
      .toBe(MONTHLY_FEE)
    const releaseTx = await prisma.tokenTransaction.findFirst({
      where: { userId: host.id, relatedGroupId: group.id, type: 'release' },
    })
    expect(releaseTx?.amount).toBe(MONTHLY_FEE)

    expect((await prisma.subscription.findFirst({ where: { groupId: group.id, userId: member.id } })).status)
      .toBe('active')
  })

  it('團主逾時未啟用服務：退回額滿、扣信用分數、僅通知團主', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' });
    const member = await createUser({ tokenBalance: 1000, name: '成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })

    const hostAuth   = authHeader(host)
    const memberAuth = authHeader(member)

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', memberAuth)
      .send({ groupId: group.id });
    const applicationId = applyRes.body.id

    await request(app)
      .patch(`/api/applications/${applicationId}`)
      .set('Authorization', hostAuth)
      .send({ status: 'approved' });

    await request(app)
      .post(`/api/groups/${group.id}/lock`)
      .set('Authorization', hostAuth)
      .send({});

    const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
    await request(app)
      .patch(`/api/members/${memberRecord.id}`)
      .set('Authorization', memberAuth)
      .send({ serviceInfo: { account: 'test@example.com', password: 'secret' } });
    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('pending_activation')

    await prisma.group.update({
      where: { id: group.id },
      data:  { activateDeadline: new Date(Date.now() - 1000) },
    })

    const getRes = await request(app)
      .get(`/api/groups/${group.id}`)
      .set('Authorization', hostAuth);
    expect(getRes.status).toBe(200)
    expect(getRes.body.status).toBe('full')

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('full')
    expect(groupState.activateDeadline).toBeNull()

    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(95)
    const log = await prisma.creditScoreLog.findFirst({ where: { userId: host.id, relatedGroupId: group.id } })
    expect(log?.delta).toBe(-5)
    expect(log?.reason).toBe('逾期未啟用服務')

    const hostNotif = await prisma.notification.findFirst({ where: { userId: host.id, type: 'group_activation_expired' } })
    expect(hostNotif).toBeTruthy()
    const memberNotif = await prisma.notification.findFirst({ where: { userId: member.id, type: 'group_activation_expired' } })
    expect(memberNotif).toBeNull()
  })
})
