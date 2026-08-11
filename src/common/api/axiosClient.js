import axios from 'axios'

// ── Token helpers ──────────────────────────────────────────────────────────────
// access token 存 localStorage 沒問題（存活期短、只有 15 分鐘）；
// refresh token 已改存 HttpOnly Cookie（見下方 refreshAccessToken），這裡不再管它
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
// withCredentials：refresh token 改存 HttpOnly Cookie，跨請求靠瀏覽器自動帶上，
// 前端完全碰不到也存取不到這個 token 的內容
const client = axios.create({
  baseURL:         import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api',
  timeout:         15_000,
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: true,
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

  _isRefreshing = true
  try {
    // refresh token 存在 HttpOnly Cookie，瀏覽器會自動帶上（withCredentials），
    // 前端不需要也拿不到它的值；後端 rotate 後也是直接覆寫 Set-Cookie，不必手動同步
    const { accessToken } = await axios.post(
      `${client.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    ).then(r => r.data)
    tokenManager.set(accessToken)
    processQueue(null, accessToken)
    return accessToken
  } catch (refreshErr) {
    processQueue(refreshErr)
    tokenManager.remove()
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
