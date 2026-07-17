import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

async function addMember(group, user) {
  return prisma.member.create({ data: { groupId: group.id, userId: user.id } })
}

describe('帳密留言區（GET/POST /credential-comments）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('團主可以在自己群組留言', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/credential-comments')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, content: '密碼是 abc123' })
    expect(res.status).toBe(201)
    expect(res.body.content).toBe('密碼是 abc123')
  })

  it('群組成員可以留言', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)

    const res = await request(app)
      .post('/api/credential-comments')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id, content: 'Profile 名稱要選哪個？' })
    expect(res.status).toBe(201)
  })

  it('非該群組成員/團主不能留言（403）', async () => {
    const host = await createUser({ name: '團主' })
    const stranger = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/credential-comments')
      .set('Authorization', authHeader(stranger))
      .send({ groupId: group.id, content: '想偷看' })
    expect(res.status).toBe(403)
  })

  it('內容與附件都是空的話會被 zod 擋下', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/credential-comments')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, content: '' })
    expect(res.status).toBe(400)
  })

  it('GET 只有該群組成員/團主可以看留言，且依時間正序排列', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const stranger = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })
    await addMember(group, member)

    await request(app).post('/api/credential-comments').set('Authorization', authHeader(host)).send({ groupId: group.id, content: '第一句' })
    await request(app).post('/api/credential-comments').set('Authorization', authHeader(member)).send({ groupId: group.id, content: '第二句' })

    const res = await request(app).get(`/api/credential-comments/${group.id}`).set('Authorization', authHeader(member))
    expect(res.status).toBe(200)
    expect(res.body.map(c => c.content)).toEqual(['第一句', '第二句'])

    const forbidden = await request(app).get(`/api/credential-comments/${group.id}`).set('Authorization', authHeader(stranger))
    expect(forbidden.status).toBe(403)
  })

  it('未登入無法留言或查看', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })
    expect((await request(app).get(`/api/credential-comments/${group.id}`)).status).toBe(401)
    expect((await request(app).post('/api/credential-comments').send({ groupId: group.id, content: 'x' })).status).toBe(401)
  })
})
