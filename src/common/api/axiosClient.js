import axios from 'axios'

// ── Token helpers ──────────────────────────────────────────────────────────────
// 集中管理 token 存取，方便日後換成 httpOnly cookie 只改這一處。
export const tokenManager = {
  get:    ()          => localStorage.getItem('pm_access_token'),
  set:    (token)     => { localStorage.setItem('pm_access_token', token); scheduleProactiveRefresh(token) },
  remove: ()          => { localStorage.removeItem('pm_access_token'); clearTimeout(_refreshTimer) },
}

// access token 存活期只有 15 分鐘（見 server/.env JWT_ACCESS_EXPIRES），使用者閒置超過這個時間後，
// 背景輪詢（訊息/通知）下一次打 API 就會先撞一次 401，即使攔截器會自動 refresh + retry、使用者
// 不會被登出，瀏覽器 Console 還是會把這筆失敗的原始請求印出來。與其被動等 401 發生再補救，
// 提前在 token 快過期前主動換新，讓輪詢永遠拿到還沒過期的 token，401 就不會發生
let _refreshTimer = null
const PROACTIVE_REFRESH_BUFFER_MS = 60_000

function decodeJwtExpiryMs(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function scheduleProactiveRefresh(token) {
  clearTimeout(_refreshTimer)
  const expiresAtMs = decodeJwtExpiryMs(token)
  if (!expiresAtMs) return
  const delay = expiresAtMs - Date.now() - PROACTIVE_REFRESH_BUFFER_MS
  // 已經沒剩多少時間就不排了，交給既有的 401 攔截器補救即可
  if (delay <= 0) return
  _refreshTimer = setTimeout(() => { refreshAccessToken().catch(() => {}) }, delay)
}

// ── Axios instance ─────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Request：自動帶入 JWT
client.interceptors.request.use(
  (config) => {
    const token = tokenManager.get()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ── Token refresh（401 攔截器與主動換新共用同一套邏輯，用 _isRefreshing 去重，
//    避免兩邊同時觸發 refresh 而打兩次 /auth/refresh）───────────────────────────
let _isRefreshing = false
let _refreshQueue = []

function processQueue(error, token = null) {
  _refreshQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  _refreshQueue = []
}

async function refreshAccessToken() {
  if (_isRefreshing) {
    return new Promise((resolve, reject) => { _refreshQueue.push({ resolve, reject }) })
  }

  const refreshToken = localStorage.getItem('pm_refresh_token')
  if (!refreshToken) {
    const err = new Error('登入已過期，請重新登入')
    tokenManager.remove()
    localStorage.removeItem('pm_refresh_token')
    window.location.replace('/login')
    throw err
  }

  _isRefreshing = true
  try {
    const { accessToken, refreshToken: newRefreshToken } = await axios.post(
      `${client.defaults.baseURL}/auth/refresh`,
      { refreshToken },
    ).then(r => r.data)
    tokenManager.set(accessToken)
    // 後端會 rotate refresh token（每次 refresh 都作廢舊的、發一個新的），
    // 這裡沒同步更新的話，下一次 access token 過期時舊 refresh token 早就
    // 在 Redis 裡被覆蓋掉，refresh 會直接 401 把使用者強制登出
    if (newRefreshToken) localStorage.setItem('pm_refresh_token', newRefreshToken)
    processQueue(null, accessToken)
    return accessToken
  } catch (refreshErr) {
    processQueue(refreshErr)
    tokenManager.remove()
    localStorage.removeItem('pm_refresh_token')
    window.location.replace('/login')
    throw refreshErr
  } finally {
    _isRefreshing = false
  }
}

// Response：統一錯誤處理，只回傳 data
client.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const status   = error.response?.status
    const original = error.config

    // 沒帶 token 的 401：未登入呼叫受保護端點，靜默拒絕
    if (status === 401 && !tokenManager.get()) {
      const message = error.response?.data?.message ?? error.message ?? '發生錯誤，請稍後再試'
      const rejected = new Error(message)
      rejected.response = error.response
      return Promise.reject(rejected)
    }

    // 帶了 token 卻收到 401 且尚未 retry：嘗試 refresh
    if (status === 401 && tokenManager.get() && !original._retry) {
      original._retry = true
      try {
        const accessToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${accessToken}`
        return client(original)
      } catch (refreshErr) {
        return Promise.reject(refreshErr)
      }
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      '發生錯誤，請稍後再試'

    const rejected = new Error(message)
    rejected.response = error.response
    return Promise.reject(rejected)
  },
)

// 頁面重新整理時，若 localStorage 已經有 token（例如上次登入還沒過期），
// 要立刻排一次主動換新的排程，不能只靠 tokenManager.set 被呼叫時才排
// （那只涵蓋登入/註冊/refresh 當下，不涵蓋單純重新整理頁面沿用舊 token 的情況）
scheduleProactiveRefresh(tokenManager.get())

export default client
