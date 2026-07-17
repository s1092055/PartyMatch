import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, authHeader } from './helpers/factories.js'

async function createAdminWithPassword({ email = 'admin@partymatch.test', password = 'a-very-strong-password', name = '管理員' } = {}) {
  const passwordHash = await bcrypt.hash(password, 12)
  const admin = await prisma.adminUser.create({ data: { email, passwordHash, name } })
  return { admin, password }
}

describe('管理員登入（POST /admin/auth/login）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('帳密正確可以登入，拿到 accessToken 跟獨立的 refresh cookie', async () => {
    const { admin, password } = await createAdminWithPassword()

    const res = await request(app).post('/api/admin/auth/login').send({ email: admin.email, password })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTypeOf('string')
    expect(res.body.admin.id).toBe(admin.id)
    expect(res.body.admin.passwordHash).toBeUndefined()

    const setCookie = res.headers['set-cookie']?.join(';') ?? ''
    expect(setCookie).toContain('pm_admin_refresh_token=')
    expect(setCookie).toContain('/api/admin/auth')
  })

  it('密碼錯誤回 401', async () => {
    const { admin } = await createAdminWithPassword()
    const res = await request(app).post('/api/admin/auth/login').send({ email: admin.email, password: 'wrong-password' })
    expect(res.status).toBe(401)
  })

  it('帳號不存在回 401', async () => {
    const res = await request(app).post('/api/admin/auth/login').send({ email: 'nobody@partymatch.test', password: 'anything' })
    expect(res.status).toBe(401)
  })

  it('登入後的 accessToken 可以打管理員限定 API', async () => {
    const { admin, password } = await createAdminWithPassword()
    const login = await request(app).post('/api/admin/auth/login').send({ email: admin.email, password })

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${login.body.accessToken}`)
    expect(res.status).toBe(200)
  })

  it('一般使用者的帳密無法登入管理員後台（AdminUser 表裡沒有這個 email）', async () => {
    const user = await createUser()
    const res = await request(app).post('/api/admin/auth/login').send({ email: user.email, password: 'whatever' })
    expect(res.status).toBe(401)
  })

  it('一般使用者的 access token 無法拿來打管理員 API（簽章金鑰不同）', async () => {
    const user = await createUser()
    const res = await request(app).get('/api/admin/stats').set('Authorization', authHeader(user))
    expect(res.status).toBe(401)
  })
})
