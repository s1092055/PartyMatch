import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'

describe('更新群組（PATCH /groups/:id）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('團主可以更新一般欄位（不涉及狀態機），不用經過 ALLOWED_TRANSITIONS 檢查', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host, billingCycle: 'monthly' })

    const res = await request(app)
      .patch(`/api/groups/${group.id}`)
      .set('Authorization', authHeader(host))
      .send({ billingCycle: 'yearly' })
    expect(res.status).toBe(200)
    expect(res.body.billingCycle).toBe('yearly')
  })

  it('允許的狀態轉換可以成功，active → ended 會通知所有成員', async () => {
    const host   = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await prisma.group.update({ where: { id: group.id }, data: { status: 'active' } })
    await prisma.member.create({ data: { groupId: group.id, userId: member.id } })

    const res = await request(app)
      .patch(`/api/groups/${group.id}`)
      .set('Authorization', authHeader(host))
      .send({ status: 'ended' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ended')

    const notification = await prisma.notification.findFirst({
      where: { userId: member.id, type: 'group_ended', meta: { path: '$.groupId', equals: group.id } },
    })
    expect(notification).toBeTruthy()
  })

  it('不允許的狀態轉換（recruiting 直接跳 active）會被拒絕', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .patch(`/api/groups/${group.id}`)
      .set('Authorization', authHeader(host))
      .send({ status: 'active' })
    expect(res.status).toBe(400)

    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('recruiting')
  })

  it('非團主無法更新群組', async () => {
    const host     = await createUser({ name: '團主' })
    const stranger = await createUser({ name: '陌生人' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .patch(`/api/groups/${group.id}`)
      .set('Authorization', authHeader(stranger))
      .send({ billingCycle: 'yearly' })
    expect(res.status).toBe(403)
  })
})
