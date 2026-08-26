import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

async function addMember(group, user) {
  return prisma.member.create({ data: { groupId: group.id, userId: user.id } })
}

describe('互評（POST /reviews, GET /reviews/user/:userId）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('群組成員可以對團主留下評價', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id, revieweeId: host.id, rating: 5, comment: '很棒' })
    expect(res.status).toBe(201)
    expect(res.body.rating).toBe(5)

    const review = await prisma.review.findUnique({ where: { groupId_authorId_revieweeId: { groupId: group.id, authorId: member.id, revieweeId: host.id } } })
    expect(review).not.toBeNull()
  })

  it('團主可以對群組成員留下評價', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, revieweeId: member.id, rating: 4, comment: '配合度很好' })
    expect(res.status).toBe(201)
    expect(res.body.revieweeId).toBe(member.id)
  })

  it('不能評價自己（400）', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, revieweeId: host.id, rating: 5 })
    expect(res.status).toBe(400)
  })

  it('非該群組成員不能評價團主（403）', async () => {
    const host = await createUser({ name: '團主' })
    const stranger = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', authHeader(stranger))
      .send({ groupId: group.id, revieweeId: host.id, rating: 3 })
    expect(res.status).toBe(403)
  })

  it('團主不能評價不在此群組的人（403）', async () => {
    const host = await createUser({ name: '團主' })
    const outsider = await createUser({ name: '不相干的人' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, revieweeId: outsider.id, rating: 3 })
    expect(res.status).toBe(403)
  })

  it('成員之間不能互評彼此（400，只能跟團主互評）', async () => {
    const host = await createUser({ name: '團主' })
    const memberA = await createUser({ name: 'A' })
    const memberB = await createUser({ name: 'B' })
    const { group } = await createGroup({ host, maxMembers: 3 })
    await addMember(group, memberA)
    await addMember(group, memberB)

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', authHeader(memberA))
      .send({ groupId: group.id, revieweeId: memberB.id, rating: 5 })
    expect(res.status).toBe(400)
  })

  it('rating 超出 1-5 範圍會被 zod 擋下', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id, revieweeId: host.id, rating: 6 })
    expect(res.status).toBe(400)
  })

  it('GET /reviews/user/:userId 回傳平均分數、總數與評價清單（不需登入）', async () => {
    const host = await createUser({ name: '團主' })
    const memberA = await createUser({ name: 'A' })
    const memberB = await createUser({ name: 'B' })
    const { group: groupA } = await createGroup({ host })
    const { group: groupB } = await createGroup({ host })
    await addMember(groupA, memberA)
    await addMember(groupB, memberB)
    await request(app).post('/api/reviews').set('Authorization', authHeader(memberA)).send({ groupId: groupA.id, revieweeId: host.id, rating: 4 })
    await request(app).post('/api/reviews').set('Authorization', authHeader(memberB)).send({ groupId: groupB.id, revieweeId: host.id, rating: 2 })

    const res = await request(app).get(`/api/reviews/user/${host.id}`)
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(2)
    expect(res.body.average).toBe(3)
    expect(res.body.reviews).toHaveLength(2)
  })

  it('未登入不能留下評價', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })
    const res = await request(app).post('/api/reviews').send({ groupId: group.id, revieweeId: host.id, rating: 5 })
    expect(res.status).toBe(401)
  })
})

describe('評價驅動信用分數（5★ 加分／1-2★ 扣分／3-4★ 不動）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  async function setup() {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await addMember(group, member)
    return { host, member, group }
  }

  it('收到 5★ 好評：對方信用分數 +5，並在 CreditScoreLog 留下關聯評價', async () => {
    const { host, member, group } = await setup()
    await prisma.user.update({ where: { id: host.id }, data: { creditScore: 90 } })

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id, revieweeId: host.id, rating: 5 })

    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(95)
    const log = await prisma.creditScoreLog.findFirst({ where: { userId: host.id } })
    expect(log?.delta).toBe(5)
    expect(log?.relatedReviewId).toBe(res.body.id)
  })

  it('收到 1★／2★ 差評：對方信用分數各 -5', async () => {
    const oneStarCase = await setup()
    await request(app).post('/api/reviews').set('Authorization', authHeader(oneStarCase.member)).send({ groupId: oneStarCase.group.id, revieweeId: oneStarCase.host.id, rating: 1 })
    expect((await prisma.user.findUnique({ where: { id: oneStarCase.host.id } })).creditScore).toBe(95)

    const twoStarCase = await setup()
    await request(app).post('/api/reviews').set('Authorization', authHeader(twoStarCase.member)).send({ groupId: twoStarCase.group.id, revieweeId: twoStarCase.host.id, rating: 2 })
    expect((await prisma.user.findUnique({ where: { id: twoStarCase.host.id } })).creditScore).toBe(95)
  })

  it('收到 3★／4★：信用分數不動', async () => {
    const { host, member, group } = await setup()
    await request(app).post('/api/reviews').set('Authorization', authHeader(member)).send({ groupId: group.id, revieweeId: host.id, rating: 3 })
    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(100)

    await request(app).post('/api/reviews').set('Authorization', authHeader(member)).send({ groupId: group.id, revieweeId: host.id, rating: 4 })
    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(100)
  })

  it('編輯既有評價只套用新舊分數差額，不會重複疊加', async () => {
    const { host, member, group } = await setup()
    await prisma.user.update({ where: { id: host.id }, data: { creditScore: 90 } })
    const auth = authHeader(member)

    await request(app).post('/api/reviews').set('Authorization', auth).send({ groupId: group.id, revieweeId: host.id, rating: 5 })
    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(95)

    // 改成 1★：從 +5 變成 -5，差額 -10
    await request(app).post('/api/reviews').set('Authorization', auth).send({ groupId: group.id, revieweeId: host.id, rating: 1 })
    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(85)

    // 改成 3★：從 -5 變成 0，差額 +5
    await request(app).post('/api/reviews').set('Authorization', auth).send({ groupId: group.id, revieweeId: host.id, rating: 3 })
    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(90)

    expect(await prisma.review.count({ where: { groupId: group.id, authorId: member.id, revieweeId: host.id } })).toBe(1)
  })

  it('信用分數不會扣到 0 以下', async () => {
    const { host, member, group } = await setup()
    await prisma.user.update({ where: { id: host.id }, data: { creditScore: 3 } })

    await request(app).post('/api/reviews').set('Authorization', authHeader(member)).send({ groupId: group.id, revieweeId: host.id, rating: 1 })
    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(0)

    const log = await prisma.creditScoreLog.findFirst({ where: { userId: host.id }, orderBy: { createdAt: 'desc' } })
    expect(log?.delta).toBe(-3)
  })

  it('信用分數不會加到 100 以上', async () => {
    const { host, member, group } = await setup()
    await prisma.user.update({ where: { id: host.id }, data: { creditScore: 98 } })

    await request(app).post('/api/reviews').set('Authorization', authHeader(member)).send({ groupId: group.id, revieweeId: host.id, rating: 5 })
    expect((await prisma.user.findUnique({ where: { id: host.id } })).creditScore).toBe(100)
  })
})
