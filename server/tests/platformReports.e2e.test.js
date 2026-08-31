import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, createAdminUser, authHeader, adminAuthHeader } from './helpers/factories.js'

describe('使用者回報問題給平台（POST /platform-reports）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('團主可以回報問題', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/platform-reports')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, description: '成員一直不回應，想請客服協助' })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('pending')

    const saved = await prisma.platformReport.findUnique({ where: { id: res.body.id } })
    expect(saved.reporterId).toBe(host.id)
    expect(saved.groupId).toBe(group.id)
  })

  it('成員可以回報問題，並可以附上證據網址', async () => {
    const host = await createUser({ name: '團主' })
    const member = await createUser({ name: '成員' })
    const { group } = await createGroup({ host })
    await prisma.member.create({ data: { groupId: group.id, userId: member.id } })

    const res = await request(app)
      .post('/api/platform-reports')
      .set('Authorization', authHeader(member))
      .send({ groupId: group.id, description: '團主一直不提供帳號', evidenceUrl: 'partymatch/platform-report-evidence/abc.png' })
    expect(res.status).toBe(201)
    expect(res.body.evidenceUrl).toBe('partymatch/platform-report-evidence/abc.png')
  })

  it('跟這個群組無關的使用者回報會被拒絕（403）', async () => {
    const host = await createUser({ name: '團主' })
    const outsider = await createUser({ name: '路人' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/platform-reports')
      .set('Authorization', authHeader(outsider))
      .send({ groupId: group.id, description: '隨便寫的內容' })
    expect(res.status).toBe(403)
  })

  it('沒有問題說明會回 400', async () => {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })

    const res = await request(app)
      .post('/api/platform-reports')
      .set('Authorization', authHeader(host))
      .send({ groupId: group.id, description: '' })
    expect(res.status).toBe(400)
  })

  it('未登入回 401', async () => {
    const res = await request(app).post('/api/platform-reports').send({ groupId: 'x', description: 'test' })
    expect(res.status).toBe(401)
  })
})

describe('管理員處理使用者回報（GET/POST /admin/platform-reports）', () => {
  beforeEach(async () => {
    await resetDb()
  })

  async function createReport() {
    const host = await createUser({ name: '團主' })
    const { group } = await createGroup({ host })
    const report = await prisma.platformReport.create({
      data: { groupId: group.id, reporterId: host.id, description: '測試回報內容' },
    })
    return { host, group, report }
  }

  it('管理員可以列出待處理的回報（預設 status=pending）', async () => {
    const admin = await createAdminUser()
    const { report, host, group } = await createReport()

    const res = await request(app).get('/api/admin/platform-reports').set('Authorization', adminAuthHeader(admin))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe(report.id)
    expect(res.body[0].reporterName).toBe(host.name)
    expect(res.body[0].groupId).toBe(group.id)
  })

  it('管理員可以標記回報為已處理，重複標記會回 400', async () => {
    const admin = await createAdminUser()
    const { report } = await createReport()

    const res = await request(app)
      .post(`/api/admin/platform-reports/${report.id}/resolve`)
      .set('Authorization', adminAuthHeader(admin))
      .send({ resolutionNote: '已聯繫雙方協調完成' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('resolved')
    expect(res.body.resolvedByAdminId).toBe(admin.id)

    const again = await request(app)
      .post(`/api/admin/platform-reports/${report.id}/resolve`)
      .set('Authorization', adminAuthHeader(admin))
      .send({})
    expect(again.status).toBe(400)
  })

  it('一般使用者的 token 無法呼叫管理員端點（401）', async () => {
    const user = await createUser()
    const { report } = await createReport()

    const listRes = await request(app).get('/api/admin/platform-reports').set('Authorization', authHeader(user))
    expect(listRes.status).toBe(401)

    const resolveRes = await request(app)
      .post(`/api/admin/platform-reports/${report.id}/resolve`)
      .set('Authorization', authHeader(user))
    expect(resolveRes.status).toBe(401)
  })
})
