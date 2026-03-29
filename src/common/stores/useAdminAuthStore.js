import { create } from 'zustand'
import { adminTokenManager } from '../api/adminAxiosClient'
import { adminLogin, adminLogout, fetchAdminMe } from '../api/adminApi';

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
}));
