// 一次性腳本：為所有已存在的舊帳號補建立系統聊天室（新註冊帳號已在 auth.js 自動建立，不受影響）
// 執行方式：node prisma/backfillSystemConversations.js
import prisma from '../src/lib/prisma.js'
import { getSystemUserId, deliverSystemMessage } from '../src/lib/systemUser.js'

async function main() {
  const systemUserId = await getSystemUserId()
  const users = await prisma.user.findMany({ where: { id: { not: systemUserId } }, select: { id: true, name: true } })

  let created = 0
  for (const user of users) {
    const existing = await prisma.conversation.findFirst({
      where: { type: 'system', participants: { array_contains: user.id } },
    })
    if (existing) continue

    const conversation = await prisma.conversation.create({
      data: { type: 'system', participants: [user.id] },
    })
    await deliverSystemMessage(conversation, '歡迎加入 PartyMatch！這裡是系統通知聊天室，平台公告與客服回覆都會顯示在這裡。')
    created += 1
    console.log(`已建立系統聊天室：${user.name} (${user.id})`)
  }

  console.log(`完成，共建立 ${created} 間系統聊天室`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
