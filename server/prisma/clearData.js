import 'dotenv/config';
import prisma from '../src/lib/prisma.js'

async function main() {
  console.log('清空資料中（保留 users、services，以及使用者註冊時收到的系統訊息）...\n')

  await prisma.credentialComment.deleteMany()
  console.log('  - credential_comments')

  await prisma.dispute.deleteMany()
  console.log('  - disputes')

  await prisma.creditScoreLog.deleteMany()
  console.log('  - credit_score_logs')

  await prisma.review.deleteMany()
  console.log('  - reviews')

  await prisma.message.deleteMany({ where: { conversation: { type: { not: 'system' } } } })
  console.log('  - messages（system 類型的系統訊息保留）')

  await prisma.conversation.deleteMany({ where: { type: { not: 'system' } } })
  console.log('  - conversations（system 類型保留）')

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

  await prisma.user.updateMany({ data: { tokenBalance: 0, creditScore: 100 } })
  console.log('  - 所有使用者 PM幣已歸零、信用分數重置為 100')

  console.log('\n清空完成（users、services、系統訊息已保留）')
}

main()
  .catch(err => { console.error('清空失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
