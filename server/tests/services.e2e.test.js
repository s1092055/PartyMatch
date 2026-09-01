import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'

async function createService(overrides = {}) {
  return prisma.service.create({
    data: {
      id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: '測試服務',
      category: 'other',
      plans: [{ id: 'plan-basic', name: '基本方案', maxMembers: 2, totalMonthlyFee: 300, currency: 'TWD' }],
      ...overrides,
    },
  })
}

describe('服務目錄（GET /services, GET /services/:id）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('GET /services 依名稱排序回傳所有服務（不需登入）', async () => {
    await createService({ name: 'B服務' })
    await createService({ name: 'A服務' })

    const res = await request(app).get('/api/services')
    expect(res.status).toBe(200)
    expect(res.body.map(s => s.name)).toEqual(['A服務', 'B服務'])
  })

  it('GET /services 有快取：第二次呼叫直接回傳 Redis 快取的內容', async () => {
    await createService({ name: 'C服務' })
    const first = await request(app).get('/api/services')
    expect(first.status).toBe(200)

    await createService({ name: 'D服務（第一次呼叫後才建立，理論上快取命中就不會出現）' })
    const second = await request(app).get('/api/services')
    expect(second.status).toBe(200)
    expect(second.body).toHaveLength(first.body.length)
  })

  it('GET /services/:id 回傳單一服務', async () => {
    const service = await createService({ name: '單一服務' })
    const res = await request(app).get(`/api/services/${service.id}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(service.id)
  })

  it('GET /services/:id 找不到回 404', async () => {
    const res = await request(app).get('/api/services/does-not-exist')
    expect(res.status).toBe(404)
  })
})
