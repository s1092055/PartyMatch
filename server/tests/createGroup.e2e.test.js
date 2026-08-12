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
    expect(res.body.monthlyFee).toBe(400) // 確認 Decimal 有正確轉回 number
    expect(res.body.billingCycle).toBe('monthly')

    const groupState = await prisma.group.findUnique({ where: { id: res.body.id } })
    expect(groupState.rules).toBe('準時繳費\n勿分享帳號') // rules 陣列會被轉成換行字串
  })

  // 這是針對「建立群組時後端直接信任前端傳的 monthlyFee/maxMembers」這個真的存在過的漏洞
  // 寫的迴歸測試：不管前端在請求裡塞什麼價格/名額，實際寫入的值都要是服務目錄裡的真實方案價格
  it('無視前端在請求裡夾帶的 monthlyFee/maxMembers/totalSeats/pricePerSeat，一律用服務目錄的權威價格', async () => {
    const host = await createUser({ name: '團主' })
    const service = await createService()

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(host))
      .send({
        serviceId: service.id, planName: '基本方案',
        monthlyFee: 1, maxMembers: 10, totalSeats: 3, pricePerSeat: 1, currency: 'USD', billingCycle: 'yearly',
      })
    expect(res.status).toBe(201)
    expect(res.body.maxMembers).toBe(4)     // 不是請求裡的 10 或 3
    expect(res.body.monthlyFee).toBe(400)   // 不是請求裡的 1
    expect(res.body.currency).toBe('TWD')   // 不是請求裡的 USD
    expect(res.body.billingCycle).toBe('monthly') // 方案名稱沒有「年繳」字樣，不是請求裡的 yearly

    const groupState = await prisma.group.findUnique({ where: { id: res.body.id } })
    expect(groupState.monthlyFee.toString()).toBe('400')
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
