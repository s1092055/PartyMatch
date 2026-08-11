import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, authHeader } from './helpers/factories.js'

async function createService() {
  return prisma.service.create({
    data: {
      id:       `svc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name:     '測試服務',
      category: 'other',
      plans:    [{ id: 'plan-basic', name: '基本方案', maxMembers: 4, monthlyFee: 400, currency: 'TWD' }],
    },
  })
}

describe('建立群組（POST /groups）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('登入使用者可以建立群組，狀態預設 recruiting、自己是團主', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({
        serviceId:  service.id,
        planName:   '基本方案',
        maxMembers: 4,
        monthlyFee: 400,
        billingCycle: 'monthly',
        rules: ['準時繳費', '勿分享帳號'],
      })
    expect(res.status).toBe(201)
    expect(res.body.hostId).toBe(host.id)
    expect(res.body.status).toBe('recruiting')
    expect(res.body.currentMembers).toBe(0)
    expect(res.body.monthlyFee).toBe(400) // 確認 Decimal 有正確轉回 number

    const groupState = await prisma.group.findUnique({ where: { id: res.body.id } })
    expect(groupState.rules).toBe('準時繳費\n勿分享帳號') // rules 陣列會被轉成換行字串
  })

  it('接受前端慣用的 totalSeats/pricePerSeat 別名欄位', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({ serviceId: service.id, planName: '基本方案', totalSeats: 3, pricePerSeat: 200 })
    expect(res.status).toBe(201)
    expect(res.body.maxMembers).toBe(3)
    expect(res.body.monthlyFee).toBe(200)
  })

  it('缺少必填欄位（planName）時回 400', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({ serviceId: service.id })
    expect(res.status).toBe(400)
  })

  it('未登入無法建立群組', async () => {
    const service = await createService()
    const res = await request(app)
      .post('/api/groups')
      .send({ serviceId: service.id, planName: '基本方案' })
    expect(res.status).toBe(401)
  })
})
