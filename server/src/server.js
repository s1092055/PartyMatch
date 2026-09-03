import 'dotenv/config'
import app from './app.js'
import prisma from './lib/prisma.js'
import redis from './lib/redis.js'
import { startPresenceSweep } from './lib/presenceSweeper.js'

const PORT = process.env.PORT ?? 3001

const MAX_DB_CONNECT_ATTEMPTS = 5

async function connectDbWithRetry() {
  for (let attempt = 1; attempt <= MAX_DB_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      await prisma.$connect()
      console.log('[DB] MySQL 連線成功')
      return
    } catch (err) {
      if (attempt === MAX_DB_CONNECT_ATTEMPTS) throw err
      const delayMs = 1000 * 2 ** (attempt - 1)
      console.error(`[DB] 連線失敗（第 ${attempt}/${MAX_DB_CONNECT_ATTEMPTS} 次），${delayMs}ms 後重試`, err.message)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

async function start() {
  try {
    await connectDbWithRetry()

    await redis.ping()
    console.log('[Cache] Redis 連線成功')

    startPresenceSweep()

    app.listen(PORT, () => {
      console.log(`[Server] 啟動於 http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('[Server] 啟動失敗', err)
    process.exit(1)
  }
}

start()
