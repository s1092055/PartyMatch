import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'
import { encryptCredential } from '../src/lib/credentialEncryption.js'

const MONTHLY_FEE = 300

describe('群組敏感欄位遮罩（sharedCredentials／serviceInfo）', () => {
  let host, member, otherUser, group

  beforeEach(async () => {
    await resetDb()
    host = await createUser({ tokenBalance: 0, name: '團主' })
    member = await createUser({ tokenBalance: 1000, name: '成員' })
    otherUser = await createUser({ tokenBalance: 1000, name: '不相干的使用者' })
    ;({ group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 3 }))

    await prisma.group.update({
      where: { id: group.id },
      data:  { sharedCredentials: encryptCredential('netflix-shared@example.com / super-secret-password') },
    });
    await prisma.member.create({
      data: {
        groupId: group.id,
        userId:  member.id,
        serviceInfo: { account: 'member-own-account@example.com', password: 'member-secret' },
        serviceInfoIssueNote: '密碼登不進去',
        disputeEvidenceUrl: 'partymatch/dispute-evidence/test-evidence.png',
      },
    })
  })

  it('GET /groups（列表）不會回傳 sharedCredentials，不管有沒有登入', async () => {
    const guestRes = await request(app).get('/api/groups?status=all')
    expect(guestRes.status).toBe(200)
    const guestGroup = guestRes.body.find(g => g.id === group.id)
    expect(guestGroup.sharedCredentials).toBeUndefined()

    const hostRes = await request(app).get('/api/groups?status=all').set('Authorization', authHeader(host))
    const hostGroup = hostRes.body.find(g => g.id === group.id)
    expect(hostGroup.sharedCredentials).toBeUndefined()
  })

  it('GET /groups/:id 未登入訪客看不到 sharedCredentials 跟任何成員的 serviceInfo', async () => {
    const res = await request(app).get(`/api/groups/${group.id}`)
    expect(res.status).toBe(200)
    expect(res.body.sharedCredentials).toBeUndefined()
    const memberEntry = res.body.members.find(m => m.userId === member.id)
    expect(memberEntry.serviceInfo).toBeUndefined()
    expect(memberEntry.serviceInfoIssueNote).toBeUndefined()
    expect(memberEntry.disputeEvidenceUrl).toBeUndefined()
  })

  it('GET /groups/:id 不相干的已登入使用者（非團主非成員）一樣看不到', async () => {
    const res = await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(otherUser))
    expect(res.status).toBe(200)
    expect(res.body.sharedCredentials).toBeUndefined()
    const memberEntry = res.body.members.find(m => m.userId === member.id)
    expect(memberEntry.serviceInfo).toBeUndefined()
  })

  it('GET /groups/:id 團主看得到 sharedCredentials 跟所有成員的 serviceInfo，disputeEvidenceUrl 是簽過章的短效網址', async () => {
    const res = await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(host))
    expect(res.status).toBe(200)
    expect(res.body.sharedCredentials).toBe('netflix-shared@example.com / super-secret-password')
    const memberEntry = res.body.members.find(m => m.userId === member.id)
    expect(memberEntry.serviceInfo).toEqual({ account: 'member-own-account@example.com', password: 'member-secret' })
    expect(memberEntry.disputeEvidenceUrl).toContain('partymatch/dispute-evidence/test-evidence.png')
    expect(memberEntry.disputeEvidenceUrl).toContain('X-Amz-Signature')
  })

  it('sharedCredentials 在資料庫內不是明文，一定是 AES-256-GCM 密文', async () => {
    const raw = await prisma.group.findUnique({ where: { id: group.id }, select: { sharedCredentials: true } })
    expect(raw.sharedCredentials).not.toBe('netflix-shared@example.com / super-secret-password')
    expect(raw.sharedCredentials).not.toContain('netflix-shared@example.com')
  })

  it('GET /groups/:id 成員看得到 sharedCredentials 跟自己的 serviceInfo，看不到其他成員的', async () => {
    const anotherMember = await createUser({ tokenBalance: 1000, name: '另一位成員' });
    await prisma.member.create({
      data: { groupId: group.id, userId: anotherMember.id, serviceInfo: { account: 'another@example.com', password: 'another-secret' } },
    })

    const res = await request(app).get(`/api/groups/${group.id}`).set('Authorization', authHeader(member))
    expect(res.status).toBe(200)
    expect(res.body.sharedCredentials).toBe('netflix-shared@example.com / super-secret-password')

    const ownEntry = res.body.members.find(m => m.userId === member.id)
    expect(ownEntry.serviceInfo).toEqual({ account: 'member-own-account@example.com', password: 'member-secret' })

    const otherEntry = res.body.members.find(m => m.userId === anotherMember.id)
    expect(otherEntry.serviceInfo).toBeUndefined()
  })

  it('GET /members?groupId= 一般成員看得到自己的 serviceInfo，看不到其他成員的', async () => {
    const anotherMember = await createUser({ tokenBalance: 1000, name: '另一位成員' })
    await prisma.member.create({
      data: { groupId: group.id, userId: anotherMember.id, serviceInfo: { account: 'another@example.com', password: 'another-secret' } },
    })

    const res = await request(app).get(`/api/members?groupId=${group.id}`).set('Authorization', authHeader(member))
    expect(res.status).toBe(200)

    const ownEntry = res.body.find(m => m.userId === member.id)
    expect(ownEntry.serviceInfo).toEqual({ account: 'member-own-account@example.com', password: 'member-secret' })
    expect(ownEntry.disputeEvidenceUrl).toContain('partymatch/dispute-evidence/test-evidence.png');
    expect(ownEntry.disputeEvidenceUrl).toContain('X-Amz-Signature')

    const otherEntry = res.body.find(m => m.userId === anotherMember.id)
    expect(otherEntry.serviceInfo).toBeUndefined()
  });

  it('GET /members?groupId= 團主看得到所有成員的 serviceInfo', async () => {
    const res = await request(app).get(`/api/members?groupId=${group.id}`).set('Authorization', authHeader(host))
    expect(res.status).toBe(200)
    const memberEntry = res.body.find(m => m.userId === member.id)
    expect(memberEntry.serviceInfo).toEqual({ account: 'member-own-account@example.com', password: 'member-secret' })
  })

  it('GET /members（不帶 groupId，橫跨多個群組）一樣只看得到自己的 serviceInfo', async () => {
    const res = await request(app).get('/api/members').set('Authorization', authHeader(member))
    expect(res.status).toBe(200)
    const ownEntry = res.body.find(m => m.userId === member.id && m.groupId === group.id)
    expect(ownEntry.serviceInfo).toEqual({ account: 'member-own-account@example.com', password: 'member-secret' })
  })
});
