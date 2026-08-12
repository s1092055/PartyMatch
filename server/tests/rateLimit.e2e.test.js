import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { resetDb } from './helpers/db.js'

// 迴歸測試：/auth/login、/auth/register、/auth/refresh、/upload/* 原本完全沒有 rate limit，
// 任何人可以無限次嘗試登入或濫用上傳端點（真的會產生 R2 storage/bandwidth 成本）。
// 見 server/src/middleware/rateLimit.js
describe('Rate limit', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('/auth/login 同一 IP 超過上限（10 次／15 分鐘）會被 429 擋下', async () => {
    let lastStatus
    for (let i = 0; i < 11; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' })
      lastStatus = res.status
    }
    expect(lastStatus).toBe(429)
  })

  it('/upload/dispute-evidence 需登入才會計入 rate limit 判斷，但未登入也一樣會被擋（middleware 順序在 requireAuth 之前）', async () => {
    let lastStatus
    for (let i = 0; i < 31; i += 1) {
      const res = await request(app)
        .post('/api/upload/dispute-evidence')
        .send({ data: 'data:image/png;base64,not-real-data' })
      lastStatus = res.status
    }
    expect(lastStatus).toBe(429)
  })
})
