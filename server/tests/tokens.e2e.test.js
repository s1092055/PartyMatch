import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, authHeader } from './helpers/factories.js'

describe('PM 幣（GET /tokens, POST /tokens/topup）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('GET /tokens 回傳目前餘額與最近交易紀錄', async () => {
    const user = await createUser({ tokenBalance: 500 })
    await prisma.tokenTransaction.create({
      data: { userId: user.id, type: 'topup', amount: 500, note: '初始儲值' },
    })

    const res = await request(app).get('/api/tokens').set('Authorization', authHeader(user))
    expect(res.status).toBe(200)
    expect(res.body.tokenBalance).toBe(500)
    expect(res.body.transactions).toHaveLength(1)
  })

  it('POST /tokens/topup 會增加餘額並寫入一筆 topup 交易紀錄', async () => {
    const user = await createUser({ tokenBalance: 100 })

    const res = await request(app)
      .post('/api/tokens/topup')
      .set('Authorization', authHeader(user))
      .send({ amount: 500 })
    expect(res.status).toBe(200)
    expect(res.body.tokenBalance).toBe(600)

    expect((await prisma.user.findUnique({ where: { id: user.id } })).tokenBalance).toBe(600)
    const tx = await prisma.tokenTransaction.findFirst({ where: { userId: user.id, type: 'topup' } })
    expect(tx?.amount).toBe(500)
  })

  it('儲值金額超出上限（100000）會被拒絕', async () => {
    const user = await createUser({ tokenBalance: 0 })
    const res = await request(app)
      .post('/api/tokens/topup')
      .set('Authorization', authHeader(user))
      .send({ amount: 100001 })
    expect(res.status).toBe(400)
    expect((await prisma.user.findUnique({ where: { id: user.id } })).tokenBalance).toBe(0)
  })

  it('未登入無法查詢或儲值', async () => {
    const balanceRes = await request(app).get('/api/tokens')
    expect(balanceRes.status).toBe(401)

    const topupRes = await request(app).post('/api/tokens/topup').send({ amount: 100 })
    expect(topupRes.status).toBe(401)
  })
})
