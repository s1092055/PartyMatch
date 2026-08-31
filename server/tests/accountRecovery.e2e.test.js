import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createAdminUser, authHeader, adminAuthHeader } from './helpers/factories.js'

describe('帳號停用/恢復期限（POST /auth/login, /auth/reactivate）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('停用超過自助恢復期限時，登入回應的 recoverable 為 false', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const longAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
    const user = await prisma.user.create({
      data: { email: 'expired-deactivated@test.com', passwordHash, name: '停用逾期測試', phone: '+886900000001', deactivatedAt: longAgo },
    })

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'correct-password' })
    expect(res.status).toBe(403)
    expect(res.body.recoverable).toBe(false)
  })

  it('停用期限內以正確帳密可恢復帳號並直接取得 accessToken', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'recoverable@test.com', passwordHash, name: '恢復測試', phone: '+886900000001', deactivatedAt: new Date() },
    })

    const res = await request(app).post('/api/auth/reactivate').send({ email: user.email, password: 'correct-password' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.user.id).toBe(user.id)

    const reloaded = await prisma.user.findUnique({ where: { id: user.id } })
    expect(reloaded.deactivatedAt).toBeNull()

    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: 'correct-password' })
    expect(loginRes.status).toBe(200)
  })

  it('密碼錯誤回 401', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'wrong-pw-reactivate@test.com', passwordHash, name: '測試', phone: '+886900000001', deactivatedAt: new Date() },
    })

    const res = await request(app).post('/api/auth/reactivate').send({ email: user.email, password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('帳號目前是啟用狀態時回 400', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'already-active@test.com', passwordHash, name: '測試', phone: '+886900000001' },
    })

    const res = await request(app).post('/api/auth/reactivate').send({ email: user.email, password: 'correct-password' })
    expect(res.status).toBe(400)
  })

  it('超過自助恢復期限回 403 ACCOUNT_RECOVERY_EXPIRED，不會清除 deactivatedAt', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const longAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
    const user = await prisma.user.create({
      data: { email: 'expired-reactivate@test.com', passwordHash, name: '測試', phone: '+886900000001', deactivatedAt: longAgo },
    })

    const res = await request(app).post('/api/auth/reactivate').send({ email: user.email, password: 'correct-password' })
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('ACCOUNT_RECOVERY_EXPIRED')

    const reloaded = await prisma.user.findUnique({ where: { id: user.id } })
    expect(reloaded.deactivatedAt).not.toBeNull()
  })
})

describe('管理員解鎖帳號（POST /users/:id/reactivate，無視自助恢復期限）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('管理員可以恢復已停用的帳號，即使超過自助恢復期限', async () => {
    const admin = await createAdminUser()
    const longAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const target = await createUser({ name: '被停用的人' })
    await prisma.user.update({ where: { id: target.id }, data: { deactivatedAt: longAgo } })

    const res = await request(app)
      .post(`/api/users/${target.id}/reactivate`)
      .set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(200)

    const reloaded = await prisma.user.findUnique({ where: { id: target.id } })
    expect(reloaded.deactivatedAt).toBeNull()
  })

  it('帳號目前是啟用狀態時回 400', async () => {
    const admin = await createAdminUser()
    const target = await createUser()

    const res = await request(app)
      .post(`/api/users/${target.id}/reactivate`)
      .set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(400)
  })

  it('一般使用者的 token 無法呼叫（401）', async () => {
    const user = await createUser()
    const target = await createUser()
    await prisma.user.update({ where: { id: target.id }, data: { deactivatedAt: new Date() } })

    const res = await request(app)
      .post(`/api/users/${target.id}/reactivate`)
      .set('Authorization', authHeader(user))
    expect(res.status).toBe(401)
  })
})
