import 'dotenv/config'
import app from './app.js'
import prisma from './lib/prisma.js'
import redis from './lib/redis.js'

const PORT = process.env.PORT ?? 3001

async function start() {
  try {
    await prisma.$connect()
    console.log('[DB] MySQL 連線成功')

    await redis.ping()
    console.log('[Cache] Redis 連線成功')

    app.listen(PORT, () => {
      console.log(`[Server] 啟動於 http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('[Server] 啟動失敗', err)
    process.exit(1)
  }
}

start()
