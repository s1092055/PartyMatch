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

describe('調整下次扣款日', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('團主可以延後扣款日（限一次、限 7 天內），成員收到通知', async () => {
    const { host, group } = await setupConfirming()
    const before = await prisma.group.findUnique({ where: { id: group.id } })
    const requested = new Date(before.nextBillingDate)
    requested.setDate(requested.getDate() + 3)

    const res = await request(app)
      .patch(`/api/groups/${group.id}/billing-date`)
      .set('Authorization', authHeader(host))
      .send({ nextBillingDate: requested.toISOString(), note: '團主臨時出國，延後三天' })
    expect(res.status).toBe(200)

    const after = await prisma.group.findUnique({ where: { id: group.id } })
    expect(new Date(after.nextBillingDate).toISOString()).toBe(requested.toISOString())
    expect(after.billingDateAdjustedAt).toBeTruthy()
    expect(after.billingDateAdjustmentNote).toBe('團主臨時出國，延後三天')
  })

  it('同一期不能調整第二次', async () => {
    const { host, group } = await setupConfirming()
    const before = await prisma.group.findUnique({ where: { id: group.id } })
    const requested = new Date(before.nextBillingDate)
    requested.setDate(requested.getDate() + 1)

    await request(app)
      .patch(`/api/groups/${group.id}/billing-date`)
      .set('Authorization', authHeader(host))
      .send({ nextBillingDate: requested.toISOString(), note: '第一次調整' })

    const requestedAgain = new Date(requested)
    requestedAgain.setDate(requestedAgain.getDate() + 1)
    const res = await request(app)
      .patch(`/api/groups/${group.id}/billing-date`)
      .set('Authorization', authHeader(host))
      .send({ nextBillingDate: requestedAgain.toISOString(), note: '第二次調整' })
    expect(res.status).toBe(400)
  })

  it('不能延後超過 7 天，也不能提前', async () => {
    const { host, group } = await setupConfirming()
    const before = await prisma.group.findUnique({ where: { id: group.id } })

    const tooFar = new Date(before.nextBillingDate)
    tooFar.setDate(tooFar.getDate() + 8)
    const tooFarRes = await request(app)
      .patch(`/api/groups/${group.id}/billing-date`)
      .set('Authorization', authHeader(host))
      .send({ nextBillingDate: tooFar.toISOString(), note: '延太多' })
    expect(tooFarRes.status).toBe(400)

    const earlier = new Date(before.nextBillingDate)
    earlier.setDate(earlier.getDate() - 1)
    const earlierRes = await request(app)
      .patch(`/api/groups/${group.id}/billing-date`)
      .set('Authorization', authHeader(host))
      .send({ nextBillingDate: earlier.toISOString(), note: '提前' })
    expect(earlierRes.status).toBe(400)
  })
})
