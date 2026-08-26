import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, authHeader } from './helpers/factories.js'

function extractRefreshCookie(res) {
  const raw = res.headers['set-cookie']?.find(c => c.startsWith('pm_refresh_token='))
  return raw?.split(';')[0]
}

describe('註冊/登入（POST /auth/register, /auth/login）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('註冊成功會回傳 user 與 accessToken，並帶上 refresh cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'new-user@test.com', password: 'password123', name: '新使用者', phone: '+886900000001',
    })
    expect(res.status).toBe(201)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.user.email).toBe('new-user@test.com')
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(extractRefreshCookie(res)).toBeTruthy()
  })

  it('email 重複註冊會回 409', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'dup@test.com', password: 'password123', name: 'A', phone: '+886900000001',
    })
    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@test.com', password: 'password123', name: 'B', phone: '+886900000002',
    })
    expect(res.status).toBe(409)
  })

  it('手機號碼格式不對會被 zod 擋下（400）', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'bad-phone@test.com', password: 'password123', name: 'A', phone: '0900000000',
    })
    expect(res.status).toBe(400)
  })

  it('登入成功回傳 user 與 accessToken', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'login@test.com', passwordHash, name: '登入測試', phone: '+886900000001' },
    })

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'correct-password' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.user.id).toBe(user.id)
  })

  it('密碼錯誤回 401，不洩漏帳號是否存在', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    await prisma.user.create({
      data: { email: 'login2@test.com', passwordHash, name: '登入測試', phone: '+886900000001' },
    })

    const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'login2@test.com', password: 'wrong' })
    const noSuchUser    = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'wrong' })
    expect(wrongPassword.status).toBe(401)
    expect(noSuchUser.status).toBe(401)
    expect(wrongPassword.body.message).toBe(noSuchUser.body.message)
  })

  it('帳號已停用（deactivatedAt 非 null）登入會回 403', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'deactivated@test.com', passwordHash, name: '停用測試', phone: '+886900000001', deactivatedAt: new Date() },
    })

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'correct-password' })
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('ACCOUNT_DEACTIVATED')
  })
})

describe('Refresh / Logout（POST /auth/refresh, /auth/logout）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('帶著合法 refresh cookie 呼叫 /refresh 會換到新的 accessToken', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'refresh@test.com', passwordHash, name: '測試', phone: '+886900000001' },
    })
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: 'correct-password' })
    const cookie = extractRefreshCookie(loginRes)

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`)
    expect(meRes.status).toBe(200)
    expect(meRes.body.id).toBe(user.id)
  })

  it('沒有 refresh cookie 呼叫 /refresh 回 401', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
  })

  it('登出後，該 session 的 refresh token 不能再換發新的 accessToken', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'logout@test.com', passwordHash, name: '測試', phone: '+886900000001' },
    })
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: 'correct-password' })
    const cookie = extractRefreshCookie(loginRes)

    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${loginRes.body.accessToken}`)

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie)
    expect(res.status).toBe(401)
  })
})

describe('GET /auth/me', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('已登入可以取得自己的完整資料', async () => {
    const user = await createUser({ name: '自己' })
    const res = await request(app).get('/api/auth/me').set('Authorization', authHeader(user))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(user.id)
    expect(res.body.email).toBe(user.email)
  })

  it('未登入回 401', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
