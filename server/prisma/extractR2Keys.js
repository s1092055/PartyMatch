import 'dotenv/config';
import prisma from '../src/lib/prisma.js'

function toKey(value) {
  const prefix = `${process.env.R2_PUBLIC_URL}/`
  return value.startsWith(prefix) ? value.slice(prefix.length) : null
}

async function migrateMembers() {
  const members = await prisma.member.findMany({
    where:  { OR: [{ disputeEvidenceUrl: { not: null } }, { serviceInfoIssueEvidenceUrl: { not: null } }] },
    select: { id: true, disputeEvidenceUrl: true, serviceInfoIssueEvidenceUrl: true },
  })
  let migrated = 0
  for (const m of members) {
    const disputeKey = m.disputeEvidenceUrl ? toKey(m.disputeEvidenceUrl) : null
    const issueKey    = m.serviceInfoIssueEvidenceUrl ? toKey(m.serviceInfoIssueEvidenceUrl) : null
    if (!disputeKey && !issueKey) continue
    await prisma.member.update({
      where: { id: m.id },
      data: {
        ...(disputeKey && { disputeEvidenceUrl: disputeKey }),
        ...(issueKey    && { serviceInfoIssueEvidenceUrl: issueKey }),
      },
    })
    migrated += 1
  }
  console.log(`members：共 ${members.length} 筆有附件，${migrated} 筆轉成 key`)
}

async function migrateCredentialComments() {
  const comments = await prisma.credentialComment.findMany({
    where:  { attachmentUrl: { not: null } },
    select: { id: true, attachmentUrl: true },
  })
  let migrated = 0
  for (const c of comments) {
    const key = toKey(c.attachmentUrl)
    if (!key) continue
    await prisma.credentialComment.update({ where: { id: c.id }, data: { attachmentUrl: key } })
    migrated += 1
  }
  console.log(`credential_comments：共 ${comments.length} 筆有附件，${migrated} 筆轉成 key`)
}

async function migrateMessages() {
  const messages = await prisma.message.findMany({
    where:  { attachmentUrl: { not: null } },
    select: { id: true, attachmentUrl: true },
  })
  let migrated = 0
  for (const m of messages) {
    const key = toKey(m.attachmentUrl)
    if (!key) continue
    await prisma.message.update({ where: { id: m.id }, data: { attachmentUrl: key } })
    migrated += 1
  }
  console.log(`messages：共 ${messages.length} 筆有附件，${migrated} 筆轉成 key`)
}

async function main() {
  await migrateMembers()
  await migrateCredentialComments()
  await migrateMessages()
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
