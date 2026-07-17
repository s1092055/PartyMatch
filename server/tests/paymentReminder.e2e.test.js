import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'
import { advanceToConfirming } from './helpers/flows.js'

const MONTHLY_FEE = 300

async function setupActiveGroup({ memberBalance = 1000, nextBillingDate } = {}) {
  const host   = await createUser({ tokenBalance: 0, name: '團主' })
  const member = await createUser({ tokenBalance: memberBalance, name: '成員' })
  const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })
  await advanceToConfirming({ host, member, group })

  await request(app)
    .post(`/api/groups/${group.id}/confirm`)
    .set('Authorization', authHeader(member))
    .send({})

  if (nextBillingDate) {
    await prisma.group.update({ where: { id: group.id }, data: { nextBillingDate } })
  }

  return { host, member, group }
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

describe('餘額不足提醒（惰性檢查，掛在 GET /groups/:id）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('扣款日在 7 天內、成員餘額不足時，團主讀取群組會看到 hasSufficientBalanceForRenewal 為 false，且成員收到提醒通知', async () => {
    const { host, member, group } = await setupActiveGroup({ memberBalance: MONTHLY_FEE, nextBillingDate: daysFromNow(3) })

    const res = await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(host))
    expect(res.status).toBe(200)
    const memberEntry = res.body.members.find(m => m.userId === member.id)
    expect(memberEntry.hasSufficientBalanceForRenewal).toBe(false)

    // notifyBatch 是非阻塞呼叫（比照 notifyUpcomingRenewals 的既有模式），回應不等它寫完，測試要留一點時間讓它落地
    await new Promise(r => setTimeout(r, 50))
    const notifications = await prisma.notification.findMany({ where: { userId: member.id, type: 'payment_reminder' } })
    expect(notifications).toHaveLength(1)
    expect(notifications[0].meta.groupId).toBe(group.id)
  })

  it('餘額足夠時 hasSufficientBalanceForRenewal 為 true，不會發送提醒', async () => {
    const { host, member, group } = await setupActiveGroup({ memberBalance: 1000, nextBillingDate: daysFromNow(3) })

    const res = await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(host))
    const memberEntry = res.body.members.find(m => m.userId === member.id)
    expect(memberEntry.hasSufficientBalanceForRenewal).toBe(true)

    const notifications = await prisma.notification.findMany({ where: { userId: member.id, type: 'payment_reminder' } })
    expect(notifications).toHaveLength(0)
  })

  it('扣款日超過 7 天時不檢查，不回傳 hasSufficientBalanceForRenewal 欄位', async () => {
    const { host, group } = await setupActiveGroup({ memberBalance: MONTHLY_FEE, nextBillingDate: daysFromNow(30) })

    const res = await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(host))
    const memberEntry = res.body.members[0]
    expect(memberEntry.hasSufficientBalanceForRenewal).toBeUndefined()
  })

  it('非團主（成員本人）讀取群組看不到 hasSufficientBalanceForRenewal 欄位，也不會觸發提醒通知', async () => {
    const { member, group } = await setupActiveGroup({ memberBalance: MONTHLY_FEE, nextBillingDate: daysFromNow(3) })

    const res = await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(member))
    const memberEntry = res.body.members.find(m => m.userId === member.id)
    expect(memberEntry.hasSufficientBalanceForRenewal).toBeUndefined()
    expect(memberEntry.user.tokenBalance).toBeUndefined()

    await new Promise(r => setTimeout(r, 50))
    const notifications = await prisma.notification.findMany({ where: { userId: member.id, type: 'payment_reminder' } })
    expect(notifications).toHaveLength(0)
  })

  it('同一期只會發送一次提醒，重複讀取群組不會重複通知', async () => {
    const { host, member, group } = await setupActiveGroup({ memberBalance: MONTHLY_FEE, nextBillingDate: daysFromNow(3) })

    await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(host))
    await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(host))

    const notifications = await prisma.notification.findMany({ where: { userId: member.id, type: 'payment_reminder' } })
    expect(notifications).toHaveLength(1)
  })

  it('兩個幾乎同時的請求也只會送一次提醒（Redis 鎖防止併發重複發送）', async () => {
    const { host, member, group } = await setupActiveGroup({ memberBalance: MONTHLY_FEE, nextBillingDate: daysFromNow(3) })

    await Promise.all([
      request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(host)),
      request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(host)),
    ])

    await new Promise(r => setTimeout(r, 50))
    const notifications = await prisma.notification.findMany({ where: { userId: member.id, type: 'payment_reminder' } })
    expect(notifications).toHaveLength(1)
  })

  it('非團主（訪客/未登入）讀取群組不會觸發任何提醒通知', async () => {
    const { member, group } = await setupActiveGroup({ memberBalance: MONTHLY_FEE, nextBillingDate: daysFromNow(3) })

    const res = await request(app).get(`/api/groups/${group.id}`)
    expect(res.status).toBe(200)

    await new Promise(r => setTimeout(r, 50))
    const notifications = await prisma.notification.findMany({ where: { userId: member.id, type: 'payment_reminder' } })
    expect(notifications).toHaveLength(0)
  })
})
