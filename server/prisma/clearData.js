/**
 * 清空正式版資料，保留 users 與 services
 * 執行：cd server && npm run db:clear-data
 */
import 'dotenv/config'
import prisma from '../src/lib/prisma.js'

async function main() {
  console.log('🗑️  清空資料中（保留 users、services）...\n')

  await prisma.message.deleteMany()
  console.log('  ✓ messages')

  await prisma.conversation.deleteMany()
  console.log('  ✓ conversations')

  await prisma.notification.deleteMany()
  console.log('  ✓ notifications')

  await prisma.favorite.deleteMany()
  console.log('  ✓ favorites')

  await prisma.paymentRecord.deleteMany()
  console.log('  ✓ payment_records')

  await prisma.subscription.deleteMany()
  console.log('  ✓ subscriptions')

  await prisma.member.deleteMany()
  console.log('  ✓ members')

  await prisma.application.deleteMany()
  console.log('  ✓ applications')

  await prisma.group.deleteMany()
  console.log('  ✓ groups')

  console.log('\n✅ 清空完成（users 與 services 已保留）')
}

main()
  .catch(err => { console.error('❌ 清空失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
