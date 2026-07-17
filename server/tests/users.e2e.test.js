import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createAdminUser, authHeader, adminAuthHeader } from './helpers/factories.js'

describe('使用者資料（GET /users/:id, PATCH /users/me）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('GET /users/:id 對其他人隱藏頭像時遮罩 avatarInitial/avatarColor', async () => {
    const user = await createUser({ name: '目標' })
    await prisma.user.update({ where: { id: user.id }, data: { showAvatar: false, avatarInitial: 'X', avatarColor: '#fff' } })

    const res = await request(app).get(`/api/users/${user.id}`)
    expect(res.status).toBe(200)
    expect(res.body.avatarInitial).toBeFalsy()
  })

  it('GET /users/:id 找不到使用者回 404', async () => {
    const res = await request(app).get('/api/users/does-not-exist')
    expect(res.status).toBe(404)
  })

  it('PATCH /users/me 可以更新自己的個人資料', async () => {
    const user = await createUser({ name: '舊名字' })
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', authHeader(user))
      .send({ name: '新名字', bio: '哈囉' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('新名字')
    expect(res.body.bio).toBe('哈囉')
  })

  it('PATCH /users/me 手機格式不對會被 zod 擋下', async () => {
    const user = await createUser()
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', authHeader(user))
      .send({ phone: 'not-a-phone' })
    expect(res.status).toBe(400)
  })

  it('未登入不能 PATCH /users/me', async () => {
    const res = await request(app).patch('/api/users/me').send({ name: 'x' })
    expect(res.status).toBe(401)
  })

  it('GET /users/me/credit-history 回傳信用分數與紀錄', async () => {
    const user = await createUser()
    await prisma.creditScoreLog.create({
      data: { userId: user.id, delta: -5, reason: 'no_show' },
    })
    const res = await request(app).get('/api/users/me/credit-history').set('Authorization', authHeader(user))
    expect(res.status).toBe(200)
    expect(res.body.logs).toHaveLength(1)
  })
})

describe('停用帳號（POST /users/me/deactivate）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('密碼正確會停用帳號，並清掉 refresh cookie', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'deactivate-me@test.com', passwordHash, name: '測試', phone: '+886900000001' },
    })

    const res = await request(app)
      .post('/api/users/me/deactivate')
      .set('Authorization', authHeader(user))
      .send({ password: 'correct-password' })
    expect(res.status).toBe(200)
    expect((await prisma.user.findUnique({ where: { id: user.id } })).deactivatedAt).not.toBeNull()
  })

  it('密碼錯誤回 401，帳號不會被停用', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 12)
    const user = await prisma.user.create({
      data: { email: 'deactivate-wrong@test.com', passwordHash, name: '測試', phone: '+886900000001' },
    })

    const res = await request(app)
      .post('/api/users/me/deactivate')
      .set('Authorization', authHeader(user))
      .send({ password: 'wrong-password' })
    expect(res.status).toBe(401)
    expect((await prisma.user.findUnique({ where: { id: user.id } })).deactivatedAt).toBeNull()
  })

  it('沒有密碼（第三方帳號）的使用者無法用密碼停用', async () => {
    const user = await createUser()
    const res = await request(app)
      .post('/api/users/me/deactivate')
      .set('Authorization', authHeader(user))
      .send({ password: 'anything' })
    expect(res.status).toBe(400)
  })
})

describe('GET /users?email= 依 email 查詢（管理員限定）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('管理員可以用 email 查到使用者', async () => {
    const admin = await createAdminUser()
    const target = await createUser({ name: '被查的人' })

    const res = await request(app).get(`/api/users?email=${target.email}`).set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(target.id)
  })

  it('一般使用者的 token 無法呼叫（401）', async () => {
    const user = await createUser()
    const res = await request(app).get('/api/users?email=anyone@test.com').set('Authorization', authHeader(user))
    expect(res.status).toBe(401)
  })

  it('沒帶 email 回 400', async () => {
    const admin = await createAdminUser()
    const res = await request(app).get('/api/users').set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(400)
  })
})
