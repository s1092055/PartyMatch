import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

const MONTHLY_FEE = 300

describe('團主手動加入成員（POST /members）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('直接扣款、建立成員/訂閱，額滿時自動轉 full', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const target = await createUser({ tokenBalance: 1000, name: '被加入的人' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })

    const res = await request(app)
      .post('/api/members')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, userId: target.id })
    expect(res.status).toBe(201)

    expect((await prisma.user.findUnique({ where: { id: target.id } })).tokenBalance)
      .toBe(1000 - MONTHLY_FEE)
    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('full')
    expect((await prisma.group.findUnique({ where: { id: group.id } })).escrowTokens).toBe(MONTHLY_FEE)
    expect(await prisma.member.findFirst({ where: { groupId: group.id, userId: target.id } })).toBeTruthy()
    expect(await prisma.subscription.findFirst({ where: { groupId: group.id, userId: target.id } })).toBeTruthy()

    const escrowTx = await prisma.tokenTransaction.findFirst({
      where: { userId: target.id, relatedGroupId: group.id, type: 'escrow' },
    })
    expect(escrowTx?.amount).toBe(-MONTHLY_FEE)
  })

  it('被加入者PM幣餘額不足時拒絕，不建立成員也不扣款', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const target = await createUser({ tokenBalance: MONTHLY_FEE - 1, name: '窮的人' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })

    const res = await request(app)
      .post('/api/members')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, userId: target.id })
    expect(res.status).toBe(400)

    expect(await prisma.member.findFirst({ where: { groupId: group.id, userId: target.id } })).toBeNull()
    expect((await prisma.user.findUnique({ where: { id: target.id } })).tokenBalance).toBe(MONTHLY_FEE - 1)
  })

  it('非團主本人不能手動加入成員', async () => {
    const host    = await createUser({ tokenBalance: 0, name: '團主' })
    const stranger = await createUser({ tokenBalance: 1000, name: '陌生人' })
    const target  = await createUser({ tokenBalance: 1000, name: '被加入的人' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })

    const res = await request(app)
      .post('/api/members')
      .set('Authorization', authHeader(stranger))
      .send({ groupId: group.id, userId: target.id })
    expect(res.status).toBe(403)
  })
})
