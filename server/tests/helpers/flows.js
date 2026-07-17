import request from 'supertest'
import app from '../../src/app.js'
import prisma from '../../src/lib/prisma.js'
import { authHeader } from './factories.js'

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
