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
client.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const status = error.response?.status

    // 只有「帶過 token 卻被拒絕」才視為 session 過期，自動跳登入
    // 沒帶 token 的 401（未登入呼叫 auth 端點）直接靜默拒絕，不跳轉
    if (status === 401 && tokenManager.get()) {
      tokenManager.remove()
      localStorage.removeItem('pm_refresh_token')
      window.location.replace('/login')
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      '發生錯誤，請稍後再試'

    return Promise.reject(new Error(message))
  },
)

export default client
