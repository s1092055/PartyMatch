import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
})

redis.on('error', (err) => console.error('[Redis]', err.message))

export default redis
