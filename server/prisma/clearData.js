import 'dotenv/config';
import prisma from '../src/lib/prisma.js'

async function main() {
  console.log('清空資料中（保留 users、services）...\n')

  await prisma.message.deleteMany()
  console.log('  - messages')

  await prisma.conversation.deleteMany()
  console.log('  - conversations')

  await prisma.notification.deleteMany()
  console.log('  - notifications')

  await prisma.favorite.deleteMany()
  console.log('  - favorites')

  await prisma.subscription.deleteMany()
  console.log('  - subscriptions')

  await prisma.member.deleteMany()
  console.log('  - members')

  await prisma.application.deleteMany()
  console.log('  - applications')

  await prisma.group.deleteMany()
  console.log('  - groups')

  await prisma.tokenTransaction.deleteMany()
  console.log('  - token_transactions')

  await prisma.user.updateMany({ data: { tokenBalance: 0 } })
  console.log('  - 所有使用者 PM幣已歸零')

  console.log('\n清空完成（users 與 services 已保留，PM幣已歸零）')
}

main()
  .catch(err => { console.error('清空失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
