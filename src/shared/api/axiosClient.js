import axios from 'axios'

// ── Token helpers ──────────────────────────────────────────────────────────────
// 集中管理 token 存取，方便日後換成 httpOnly cookie 只改這一處。
export const tokenManager = {
  get:    ()          => localStorage.getItem('pm_access_token'),
  set:    (token)     => localStorage.setItem('pm_access_token', token),
  remove: ()          => localStorage.removeItem('pm_access_token'),
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

// Response：統一錯誤處理，只回傳 data
let _isRefreshing = false
let _refreshQueue = []

function processQueue(error, token = null) {
  _refreshQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  _refreshQueue = []
}

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

      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        })
      }

      _isRefreshing = true
      const refreshToken = localStorage.getItem('pm_refresh_token')

      if (!refreshToken) {
        tokenManager.remove()
        localStorage.removeItem('pm_refresh_token')
        window.location.replace('/login')
        return Promise.reject(new Error('登入已過期，請重新登入'))
      }

      try {
        const { accessToken } = await axios.post(
          `${client.defaults.baseURL}/auth/refresh`,
          { refreshToken },
        ).then(r => r.data)
        tokenManager.set(accessToken)
        processQueue(null, accessToken)
        original.headers.Authorization = `Bearer ${accessToken}`
        return client(original)
      } catch (refreshErr) {
        processQueue(refreshErr)
        tokenManager.remove()
        localStorage.removeItem('pm_refresh_token')
        window.location.replace('/login')
        return Promise.reject(refreshErr)
      } finally {
        _isRefreshing = false
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

export default client
