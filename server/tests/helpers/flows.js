import request from 'supertest'
import app from '../../src/app.js'
import prisma from '../../src/lib/prisma.js'
import { authHeader } from './factories.js'

// 把一個 maxMembers: 2（團主 + 1 成員）的群組推進到「confirming」（成員已鎖定、填完帳號、團主已啟用，
// 正在等待成員確認服務正常），供申訴／裁定測試共用，不用每個測試檔案各自重複同一段前置步驟
export async function advanceToConfirming({ host, member, group }) {
  const hostAuth = authHeader(host)
  const memberAuth = authHeader(member)

  const applyRes = await request(app)
    .post('/api/applications')
    .set('Authorization', memberAuth)
    .send({ groupId: group.id })

  await request(app)
    .patch(`/api/applications/${applyRes.body.id}`)
    .set('Authorization', hostAuth)
    .send({ status: 'approved' })

  await request(app)
    .post(`/api/groups/${group.id}/lock`)
    .set('Authorization', hostAuth)
    .send({})

  const memberRecord = await prisma.member.findFirst({ where: { groupId: group.id, userId: member.id } })
  await request(app)
    .patch(`/api/members/${memberRecord.id}`)
    .set('Authorization', memberAuth)
    .send({ serviceInfo: { account: 'test@example.com', password: 'secret' } })

  await request(app)
    .post(`/api/groups/${group.id}/activate`)
    .set('Authorization', hostAuth)
    .send({})

  return { memberRecord }
}
