import redis from './redis.js'

// 帳號維度的登入失敗鎖定，跟 middleware/rateLimit.js 的 authLimiter（IP 維度）互補：
// authLimiter 擋的是「同一個來源 IP 打很多次」，這裡擋的是「不管換多少個 IP，同一組帳密就是打不進去」。
// 以 email 為 key（不分大小寫），無論帳號是否存在都會計數，避免被拿來反推帳號是否存在。
const MAX_FAILED_ATTEMPTS = 10
const LOCK_WINDOW_SECONDS = 15 * 60

function attemptsKey(email) {
  return `login-attempts:${email.trim().toLowerCase()}`
}

export async function recordFailedLogin(email) {
  const key = attemptsKey(email)
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, LOCK_WINDOW_SECONDS)
  return count
}

export async function isAccountLocked(email) {
  const count = await redis.get(attemptsKey(email))
  return Number(count) >= MAX_FAILED_ATTEMPTS
}

export async function clearFailedLogins(email) {
  await redis.del(attemptsKey(email))
}
