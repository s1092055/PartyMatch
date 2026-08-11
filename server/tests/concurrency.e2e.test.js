import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/lib/prisma.js'
import { resetDb } from './helpers/db.js'
import { createUser, createGroup, authHeader } from './helpers/factories.js'
import { advanceToConfirming } from './helpers/flows.js'

const MONTHLY_FEE = 300

// 這份測試不驗證狀態機「正常路徑」的結果，驗證的是程式碼裡的樂觀鎖／條件式 updateMany
// 在真正併發時是否真的擋得住重複執行——用 Promise.all 同時打兩個請求模擬使用者快速點兩下、
// 或兩個瀏覽器分頁同時操作的情境
describe('併發安全性', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('同一位成員同時打兩次 confirm：只會撥款一次，團主餘額不會被加兩次', async () => {
    const host   = await createUser({ tokenBalance: 0, name: '團主' })
    const member = await createUser({ tokenBalance: 1000, name: '成員' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })
    await advanceToConfirming({ host, member, group })

    const memberAuth = authHeader(member)
    const [resA, resB] = await Promise.all([
      request(app).post(`/api/groups/${group.id}/confirm`).set('Authorization', memberAuth).send({}),
      request(app).post(`/api/groups/${group.id}/confirm`).set('Authorization', memberAuth).send({}),
    ])

    // 兩個請求都應該成功回應（第二個讀到「已經被別人撥款過了」的最終狀態，不是噴錯），
    // 但底層的撥款動作只會真的執行一次
    expect(resA.status).toBe(200)
    expect(resB.status).toBe(200)
    expect(resA.body.released).toBe(true)
    expect(resB.body.released).toBe(true)

    expect((await prisma.user.findUnique({ where: { id: host.id } })).tokenBalance).toBe(MONTHLY_FEE)
    expect((await prisma.group.findUnique({ where: { id: group.id } })).status).toBe('active')

    const releaseTxs = await prisma.tokenTransaction.findMany({
      where: { userId: host.id, relatedGroupId: group.id, type: 'release' },
    })
    expect(releaseTxs).toHaveLength(1)
  })

  it('最後一個名額同時被兩筆申請核准：只有一筆會成功，另一筆收到 409', async () => {
    // maxMembers 2：團主 + 1 人就滿，兩個人同時申請、團主幾乎同時核准兩筆
    const host = await createUser({ tokenBalance: 0, name: '團主' })
    const applicantA = await createUser({ tokenBalance: 1000, name: '申請人 A' })
    const applicantB = await createUser({ tokenBalance: 1000, name: '申請人 B' })
    const { group } = await createGroup({ host, monthlyFee: MONTHLY_FEE, maxMembers: 2 })
    const hostAuth = authHeader(host)

    const applyA = await request(app).post('/api/applications').set('Authorization', authHeader(applicantA)).send({ groupId: group.id })
    const applyB = await request(app).post('/api/applications').set('Authorization', authHeader(applicantB)).send({ groupId: group.id })

    const [resA, resB] = await Promise.all([
      request(app).patch(`/api/applications/${applyA.body.id}`).set('Authorization', hostAuth).send({ status: 'approved' }),
      request(app).patch(`/api/applications/${applyB.body.id}`).set('Authorization', hostAuth).send({ status: 'approved' }),
    ])

    const statuses = [resA.status, resB.status].sort()
    // 一筆核准成功（200），另一筆因為名額已滿被擋下（409，claimGroupStatus 丟出的衝突）
    expect(statuses).toEqual([200, 409])

    const groupState = await prisma.group.findUnique({ where: { id: group.id } })
    expect(groupState.status).toBe('full')
    expect(groupState.currentMembers).toBe(1) // 不會是 2，maxMembers 2 只留給團主 + 1 人的名額

    const members = await prisma.member.findMany({ where: { groupId: group.id } })
    expect(members).toHaveLength(1)
  })
})
