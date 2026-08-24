import prisma from '../../src/lib/prisma.js'
import redis from '../../src/lib/redis.js'

const TABLES = [
  'token_transactions', 'credit_score_logs', 'notifications', 'favorites',
  'messages', 'conversations', 'reviews', 'credential_comments',
  'subscriptions', 'members', 'applications', 'groups', 'services',
  'users',
];

export async function resetDb() {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')
  for (const table of TABLES) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``)
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')

  const keys = await redis.keys('groups:list:*').catch(() => [])
  keys.push('services:list')
  await redis.del(...keys).catch(() => {})
}
