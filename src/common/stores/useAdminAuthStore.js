import { create } from 'zustand'
import { adminTokenManager } from '../api/adminAxiosClient'
import { adminLogin, adminLogout, fetchAdminMe } from '../api/adminApi'

// 管理員登入狀態跟一般使用者的 useAuthStore 完全分開，不共用任何 token/使用者資料，
// 管理員帳號也不是 User，這裡的 admin 物件只有 id/email/name，沒有一般使用者才有的欄位
export const useAdminAuthStore = create((set) => ({
  admin:    null,
  loggedIn: false,

  init: async () => {
    const token = adminTokenManager.get()
    if (!token) return
    try {
      const admin = await fetchAdminMe()
      set({ admin, loggedIn: true })
    } catch {
      adminTokenManager.remove()
    }
  },

  login: async ({ email, password }) => {
    try {
      const { admin, accessToken } = await adminLogin({ email, password })
      adminTokenManager.set(accessToken)
      set({ admin, loggedIn: true })
      return { ok: true, admin }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  logout: async () => {
    try { await adminLogout() } catch {}
    adminTokenManager.remove()
    set({ admin: null, loggedIn: false })
  },
}))
