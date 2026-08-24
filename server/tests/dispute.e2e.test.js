import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'
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

describe('申訴流程', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('成員申訴：confirming → disputed', async () => {
    const { group, member } = await setupConfirming()
    const res = await raiseDispute({ group, member })
    expect(res.status).toBe(200)
    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('disputed')

    const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(memberRecord.serviceInfoIssueNote).toBe('帳號密碼登不進去')
  })

  it('團主自行協調解決：disputed → confirming，不涉及金流', async () => {
    const { host, member, group } = await setupConfirming()
    await raiseDispute({ group, member })

    const res = await request(app)
      .post(`/api/groups/${group.id}/resolve-dispute`)
      .set('Authorization', authHeader(host))
      .send({ note: '已經幫他重設密碼' })
    expect(res.status).toBe(200)

    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('confirming')
    const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(memberRecord.serviceInfoIssueNote).toBeNull()
    expect((await prisma.group.findUnique({ where: { id: group.id } })).escrowTokens).toBe(MONTHLY_FEE);
  })

  it('管理員裁定成員勝訴：退款給成員、移出群組、群組回 active', async () => {
    const { member, group } = await setupConfirming()
    await raiseDispute({ group, member })
    const admin = await createUser({ isAdmin: true, name: '管理員' })

    const res = await request(app)
      .post(`/api/groups/${group.id}/adjudicate`)
      .set('Authorization', authHeader(admin))
      .send({ winner: 'member', reason: '確認團主提供的帳密有問題' })
    expect(res.status).toBe(200)
    expect(res.body.winner).toBe('member')

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('active')
    expect(groupState.escrowTokens).toBe(0)
    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(1000)
    expect(await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })).toBeNull()

    const subscription = await prisma.subscription.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(subscription.status).toBe('ended')

    const refundTx = await prisma.tokenTransaction.findFirst({
      where: { userId: member.id, relatedGroupId: group.id, type: 'refund' },
    })
    expect(refundTx?.amount).toBe(MONTHLY_FEE)
  })

  it('管理員裁定團主勝訴：撥款給團主、群組回 active、成員訂閱維持啟用', async () => {
    const { host, member, group } = await setupConfirming()
    await raiseDispute({ group, member })
    const admin = await createUser({ isAdmin: true, name: '管理員' })

    const res = await request(app)
      .post(`/api/groups/${group.id}/adjudicate`)
      .set('Authorization', authHeader(admin))
      .send({ winner: 'host', reason: '成員操作方式有誤，服務本身正常' })
    expect(res.status).toBe(200)
    expect(res.body.winner).toBe('host')

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('active')
    expect(groupState.escrowTokens).toBe(0)
    expect((await prisma.user.findUnique({ where: { id: host.id } })).tokenBalance).toBe(MONTHLY_FEE)

    const subscription = await prisma.subscription.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(subscription.status).toBe('active')

    const releaseTx = await prisma.tokenTransaction.findFirst({
      where: { userId: host.id, relatedGroupId: group.id, type: 'release' },
    })
    expect(releaseTx?.amount).toBe(MONTHLY_FEE)
  })
})
