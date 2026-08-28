import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
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
    const memberId = (await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })).id

    const res = await request(app)
      .post(`/api/groups/${group.id}/resolve-dispute`)
      .set('Authorization', authHeader(host))
      .send({ memberId, note: '已經幫他重設密碼' })
    expect(res.status).toBe(200)

    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('confirming')
    const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(memberRecord.serviceInfoIssueNote).toBeNull()
    expect((await prisma.group.findUnique({ where: { id: group.id } })).escrowTokens).toBe(MONTHLY_FEE);
  })

  it('管理員裁定成員獲勝：退款給成員、成員留在群組內、群組回 active', async () => {
    const { member, group } = await setupConfirming()
    await raiseDispute({ group, member })
    const admin = await createAdminUser({ name: '管理員' })

    const beforeGroup = await prisma.group.findUnique({ where: { id: group.id } })
    const memberId = (await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })).id

    const res = await request(app)
      .post(`/api/groups/${group.id}/adjudicate`)
      .set('Authorization', adminAuthHeader(admin))
      .send({ memberId, winner: 'member', reason: '確認團主提供的帳密有問題' })
    expect(res.status).toBe(200)
    expect(res.body.resolutionType).toBe('member_wins')
    expect(res.body.memberRefundAmount).toBe(MONTHLY_FEE)
    expect(res.body.hostReleaseAmount).toBe(0)

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('active')
    expect(groupState.escrowTokens).toBe(0)
    expect(groupState.currentMembers).toBe(beforeGroup.currentMembers)
    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(1000)

    const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(memberRecord).not.toBeNull()
    expect(memberRecord.serviceInfoIssueNote).toBeNull()
    expect(memberRecord.disputeEvidenceUrl).toBeNull()

    const subscription = await prisma.subscription.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(subscription.status).toBe('active')

    const refundTx = await prisma.tokenTransaction.findFirst({
      where: { userId: member.id, relatedGroupId: group.id, type: 'refund' },
    })
    expect(refundTx?.amount).toBe(MONTHLY_FEE)
  })

  it('管理員裁定團主獲勝：金額留在代管池、成員回到確認期重新確認後才會撥款給團主', async () => {
    const { host, member, group } = await setupConfirming()
    await raiseDispute({ group, member })
    const admin = await createAdminUser({ name: '管理員' })

    const beforeGroup = await prisma.group.findUnique({ where: { id: group.id } })
    const memberId = (await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })).id

    const res = await request(app)
      .post(`/api/groups/${group.id}/adjudicate`)
      .set('Authorization', adminAuthHeader(admin))
      .send({ memberId, winner: 'host', reason: '成員操作方式有誤，服務本身正常' })
    expect(res.status).toBe(200)
    expect(res.body.resolutionType).toBe('host_wins')
    expect(res.body.memberRefundAmount).toBe(0)
    expect(res.body.hostReleaseAmount).toBe(0)

    // 這名成員的申訴不成立，但錢還不會馬上撥給團主——成員仍要走一般確認流程，
    // 群組打回確認期、給這名成員全新一輪確認期，等他自己重新確認才會完全結案並撥款
    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('confirming')
    expect(groupState.currentMembers).toBe(beforeGroup.currentMembers)
    expect(groupState.escrowTokens).toBe(beforeGroup.escrowTokens)
    expect((await prisma.user.findUnique({ where: { id: host.id } })).tokenBalance).toBe(0)
    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(1000 - MONTHLY_FEE)

    const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(memberRecord).not.toBeNull()
    expect(memberRecord.serviceInfoIssueNote).toBeNull()
    expect(memberRecord.disputeEvidenceUrl).toBeNull()
    expect(memberRecord.confirmedAt).toBeNull()
    expect(memberRecord.confirmDeadline).toBeTruthy()

    const subscription = await prisma.subscription.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(subscription.status).toBe('pending')

    const releaseTx = await prisma.tokenTransaction.findFirst({
      where: { userId: host.id, relatedGroupId: group.id, type: 'release' },
    })
    expect(releaseTx).toBeNull()

    // 成員重新確認服務正常後，代管款項才會撥款給團主、群組才會完全結案
    const confirmRes = await request(app)
      .post(`/api/groups/${group.id}/confirm`)
      .set('Authorization', authHeader(member))
      .send({})
    expect(confirmRes.status).toBe(200)
    expect(confirmRes.body.released).toBe(true)

    const finalGroup = await prisma.group.findUnique({ where: { id: group.id } })
    expect(finalGroup.status).toBe('active')
    expect(finalGroup.escrowTokens).toBe(0)
    expect((await prisma.user.findUnique({ where: { id: host.id } })).tokenBalance).toBe(MONTHLY_FEE)

    const finalSubscription = await prisma.subscription.findFirst({ where: { groupId: group.id, userId: member.id } })
    expect(finalSubscription.status).toBe('active')
  })

  it('管理員裁定 winner 傳入無效值：拒絕', async () => {
    const { member, group } = await setupConfirming()
    await raiseDispute({ group, member })
    const admin = await createAdminUser({ name: '管理員' })

    const res = await request(app)
      .post(`/api/groups/${group.id}/adjudicate`)
      .set('Authorization', adminAuthHeader(admin))
      .send({ winner: 'nobody', reason: '無效測試' })
    expect(res.status).toBe(400)
  })

  it('裁定紀錄在申訴發起當下就建立，成員獲勝後歷史仍可查詢', async () => {
    const { member, group } = await setupConfirming()
    await raiseDispute({ group, member })

    const pending = await prisma.dispute.findFirst({ where: { groupId: group.id, status: 'pending' } })
    expect(pending).not.toBeNull()
    expect(pending.reason).toBe('帳號密碼登不進去')

    const admin = await createAdminUser({ name: '管理員' })
    const memberId = (await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })).id
    await request(app)
      .post(`/api/groups/${group.id}/adjudicate`)
      .set('Authorization', adminAuthHeader(admin))
      .send({ memberId, winner: 'member', reason: '確認團主提供的帳密有問題' })

    const resolved = await prisma.dispute.findUnique({ where: { id: pending.id } })
    expect(resolved.status).toBe('adjudicated')
    expect(resolved.resolutionType).toBe('member_wins')
    expect(resolved.resolvedByAdminId).toBe(admin.id)
  })
})
