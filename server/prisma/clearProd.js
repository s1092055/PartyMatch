/**
 * 清空正式版所有使用者資料（保留 services 種子資料）
 * 執行：cd server && npm run db:clear
 */
import 'dotenv/config'
import prisma from '../src/lib/prisma.js'
import readline from 'readline'

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve =>
    rl.question(question, ans => { rl.close(); resolve(ans.trim().toLowerCase()) })
  )
}

async function main() {
  console.log('即將清空所有正式版使用者資料（users、groups、applications、members、subscriptions、payments、notifications、conversations、messages、favorites、refresh_tokens）')
  console.log('services 種子資料不受影響\n')

  const ans = await confirm('確定要清空嗎？請輸入 yes 繼續：')
  if (ans !== 'yes') {
    console.log('已取消')
    return
  }

  console.log('\n開始清空...')

  // 依照外鍵相依順序刪除
  await prisma.message.deleteMany()
  console.log('  - messages')

  await prisma.conversation.deleteMany()
  console.log('  - conversations')

  await prisma.notification.deleteMany()
  console.log('  - notifications')

  await prisma.favorite.deleteMany()
  console.log('  - favorites')

  await prisma.paymentRecord.deleteMany()
  console.log('  - payment_records')

  await prisma.subscription.deleteMany()
  console.log('  - subscriptions')

  await prisma.member.deleteMany()
  console.log('  - members')

  await prisma.application.deleteMany()
  console.log('  - applications')

  await prisma.group.deleteMany()
  console.log('  - groups')

  await prisma.refreshToken.deleteMany()
  console.log('  - refresh_tokens')

  await prisma.user.deleteMany()
  console.log('  - users')

  console.log('\n清空完成')
}

main()
  .catch(err => { console.error('清空失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
