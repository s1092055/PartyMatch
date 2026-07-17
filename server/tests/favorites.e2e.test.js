import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

describe('收藏（GET /favorites, POST /favorites/:groupId toggle）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('POST 第一次收藏群組：建立收藏，回傳 favorited: true', async () => {
    const host = await createUser({ name: '團主' })
    const user = await createUser({ name: '使用者' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post(`/api/favorites/${group.id}`)
      .set('Authorization', authHeader(user))
    expect(res.status).toBe(201)
    expect(res.body.favorited).toBe(true)

    const favorite = await prisma.favorite.findUnique({ where: { userId_groupId: { userId: user.id, groupId: group.id } } })
    expect(favorite).toBeTruthy()
  })

  it('POST 對已收藏的群組再次呼叫會取消收藏，回傳 favorited: false', async () => {
    const host = await createUser({ name: '團主' })
    const user = await createUser({ name: '使用者' })
    const { group } = await createGroup({ host })
    const userAuth = authHeader(user)

    await request(app).post(`/api/favorites/${group.id}`).set('Authorization', userAuth)
    const res = await request(app).post(`/api/favorites/${group.id}`).set('Authorization', userAuth)
    expect(res.status).toBe(200)
    expect(res.body.favorited).toBe(false)

    expect(await prisma.favorite.findUnique({ where: { userId_groupId: { userId: user.id, groupId: group.id } } })).toBeNull()
  })

  it('GET /favorites 依收藏時間新到舊排序，只回傳自己的收藏', async () => {
    const host = await createUser({ name: '團主' })
    const user = await createUser({ name: '使用者' })
    const other = await createUser({ name: '別人' })
    const { group: groupA } = await createGroup({ host })
    const { group: groupB } = await createGroup({ host })

    await request(app).post(`/api/favorites/${groupA.id}`).set('Authorization', authHeader(user))
    await request(app).post(`/api/favorites/${groupB.id}`).set('Authorization', authHeader(user))
    await request(app).post(`/api/favorites/${groupA.id}`).set('Authorization', authHeader(other))

    const res = await request(app).get('/api/favorites').set('Authorization', authHeader(user))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].groupId).toBe(groupB.id);
  })

  it('未登入無法查詢或收藏', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })

    expect((await request(app).get('/api/favorites')).status).toBe(401)
    expect((await request(app).post(`/api/favorites/${group.id}`)).status).toBe(401)
  })
})
