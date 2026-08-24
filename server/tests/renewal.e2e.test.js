import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'
import { advanceToConfirming } from './helpers/flows.js'

const MONTHLY_FEE = 300

async function setupActiveGroup({ memberBalance = 1000 } = {}) {
  const host   = await createUser({ tokenBalance: 0, name: '團主' })
  const member = await createUser({ tokenBalance: memberBalance, name: '成員' })
  const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })
  await advanceToConfirming({ host, member, group })

  await request(app)
    .post(`/api/groups/${group.id}/confirm`)
    .set('Authorization', authHeader(member))
    .send({})

  return { host, member, group }
}

describe('續訂', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('續訂會再跟每位成員收一次代管費用，回到 pending_confirmation', async () => {
    const { host, member, group } = await setupActiveGroup({ memberBalance: 1000 });
    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance)
      .toBe(1000 - MONTHLY_FEE);

    const res = await request(app)
      .post(`/api/groups/${group.id}/renew`)
      .set('Authorization', authHeader(host))
      .send({})
    expect(res.status).toBe(200)

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('pending_confirmation')
    expect(groupState.escrowTokens).toBe(MONTHLY_FEE)

    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance)
      .toBe(1000 - MONTHLY_FEE * 2)

    const escrowTx = await prisma.tokenTransaction.findMany({
      where: { userId: member.id, relatedGroupId: group.id, type: 'escrow' },
    })
    expect(escrowTx).toHaveLength(2);

    const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } });
    expect(memberRecord.serviceInfo).toBeNull()
  })

  it('成員PM幣餘額不足時續訂被拒絕，不會扣款也不會改狀態', async () => {
    const { host, member, group } = await setupActiveGroup({ memberBalance: MONTHLY_FEE });
    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(0)

    const res = await request(app)
      .post(`/api/groups/${group.id}/renew`)
      .set('Authorization', authHeader(host))
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE')
    expect(res.body.memberIds).toContain(member.id)

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('active')
    expect((await prisma.user.findUnique({ where: { id: member.id } })).tokenBalance).toBe(0)
  })
})
