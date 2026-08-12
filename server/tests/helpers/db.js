import prisma from '../../src/lib/prisma.js'

// 用真的測試 MySQL 資料庫（不是 mock），每個測試案例開始前清成一張白紙，
// 用 FOREIGN_KEY_CHECKS=0 整批清空，不用一張張排 FK 順序
const TABLES = [
  'token_transactions', 'credit_score_logs', 'notifications', 'favorites',
  'messages', 'conversations', 'reviews', 'credential_comments',
  'subscriptions', 'members', 'applications', 'groups', 'services',
  'users',
]

export async function resetDb() {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')
  for (const table of TABLES) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``)
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
}
