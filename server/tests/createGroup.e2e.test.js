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

  it('登入使用者可以建立群組，狀態預設 recruiting、自己是團主，價格/名額來自服務目錄', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({
        serviceId:  service.id,
        planName:   '基本方案',
        rules: ['準時繳費', '勿分享帳號'],
      })
    expect(res.status).toBe(201)
    expect(res.body.hostId).toBe(host.id)
    expect(res.body.status).toBe('recruiting')
    expect(res.body.currentMembers).toBe(0)
    expect(res.body.maxMembers).toBe(4)
    expect(res.body.monthlyFee).toBe(400);
    expect(res.body.billingCycle).toBe('monthly')

    const groupState = await prisma.group.findUnique({ where: { id: res.body.id } })
    expect(groupState.rules).toBe('準時繳費\n勿分享帳號');
  })

  it('無視前端在請求裡夾帶的 monthlyFee/totalSeats/pricePerSeat/currency/billingCycle，一律用服務目錄的權威價格', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({
        serviceId: service.id, planName: '基本方案',
        monthlyFee: 1, totalSeats: 3, pricePerSeat: 1, currency: 'USD', billingCycle: 'yearly',
      })
    expect(res.status).toBe(201)
    expect(res.body.maxMembers).toBe(4);
    expect(res.body.monthlyFee).toBe(400);
    expect(res.body.currency).toBe('TWD');
    expect(res.body.billingCycle).toBe('monthly');

    const groupState = await prisma.group.findUnique({ where: { id: res.body.id } })
    expect(groupState.monthlyFee.toString()).toBe('400')
  });

  it('maxMembers 可以在方案容量內縮小開放名額，每人單價不變', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({ serviceId: service.id, planName: '基本方案', maxMembers: 2 })
    expect(res.status).toBe(201)
    expect(res.body.maxMembers).toBe(2)
    expect(res.body.monthlyFee).toBe(400)
  })

  it('maxMembers 超過方案容量時回 400，不會建立群組', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({ serviceId: service.id, planName: '基本方案', maxMembers: 10 })
    expect(res.status).toBe(400)
    expect(await prisma.group.count()).toBe(0)
  })

  it('maxMembers 小於 2 時被 zod 擋下（400）', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({ serviceId: service.id, planName: '基本方案', maxMembers: 1 })
    expect(res.status).toBe(400)
  })

  it('billingCycle 依方案名稱是否含「年繳」判斷，不採信前端傳的值', async () => {
    const host = await createUser({ name: '團主' })
    const service = await prisma.service.create({
      data: {
        id: `svc-yearly-${Date.now()}`, name: '測試服務', category: 'other',
        plans: [{ id: 'plan-yearly', name: '年繳方案（年繳）', maxMembers: 2, monthlyFee: 100, currency: 'TWD' }],
      },
    })

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({ serviceId: service.id, planName: '年繳方案（年繳）', billingCycle: 'monthly' })
    expect(res.status).toBe(201)
    expect(res.body.billingCycle).toBe('yearly')
  })

  it('serviceId/planName 對不到任何真實方案時回 400，不會建立群組', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({ serviceId: service.id, planName: '不存在的方案' })
    expect(res.status).toBe(400)
    expect(await prisma.group.count()).toBe(0)
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
