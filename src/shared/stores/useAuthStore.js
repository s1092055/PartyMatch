import { create } from 'zustand'
import client, { tokenManager } from '../api/axiosClient'

// 登入 / 註冊後才初始化需要 auth 的 stores，避免未登入時呼叫受保護端點
async function initPrivateStores(userId) {
  const [
    { useApplicationStore },
    { useSubscriptionStore },
    { useMemberStore },
    { useFavoriteStore },
    { usePaymentStore },
    { useConversationStore },
    { useNotificationStore },
  ] = await Promise.all([
    import('./useApplicationStore'),
    import('./useSubscriptionStore'),
    import('./useMemberStore'),
    import('./useFavoriteStore'),
    import('./usePaymentStore'),
    import('./useConversationStore'),
    import('./useNotificationStore'),
  ])
  await Promise.all([
    useApplicationStore.getState().init(),
    useSubscriptionStore.getState().init(),
    useMemberStore.getState().init(),
    useFavoriteStore.getState().init(),
    usePaymentStore.getState().init(),
    useNotificationStore.getState().init(),
  ])
  useConversationStore.getState().init(userId)
  useApplicationStore.getState().checkMissedNotifications({ id: userId })
}

function activeProfile(user) {
  if (!user) return null
  const displayName = user.displayName?.trim() || user.name?.trim() || '使用者'
  return {
    ...user,
    displayName,
    avatarInitial: user.avatarInitial ?? displayName[0] ?? 'U',
    avatarColor:   user.avatarColor ?? '#3B82F6',
  }
}

export const useAuthStore = create((set, get) => ({
  user:     null,
  loggedIn: false,

  // ── 初始化（App 啟動時用儲存的 token 還原登入狀態）──────────────────────────
  init: async () => {
    const token = tokenManager.get()
    if (!token) return
    try {
      const user = await client.get('/auth/me')
      set({ user, loggedIn: true })
    } catch {
      tokenManager.remove()
    }
  },

  getProfile: () => activeProfile(get().user),

  // ── 登入 ────────────────────────────────────────────────────────────────────
  login: async ({ email, password }) => {
    try {
      const { user, accessToken, refreshToken } = await client.post('/auth/login', { email, password })
      tokenManager.set(accessToken)
      if (refreshToken) localStorage.setItem('pm_refresh_token', refreshToken)
      set({ user, loggedIn: true })
      await initPrivateStores(user.id)
      return { ok: true, user }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  loginGoogle: async () => {
    return { ok: false, error: 'Google 登入尚未支援，請使用 Email 登入' }
  },

  // ── 註冊 ────────────────────────────────────────────────────────────────────
  register: async ({ name, email, password }) => {
    try {
      const { user, accessToken, refreshToken } = await client.post('/auth/register', { name, email, password })
      tokenManager.set(accessToken)
      if (refreshToken) localStorage.setItem('pm_refresh_token', refreshToken)
      set({ user, loggedIn: true })
      await initPrivateStores(user.id)
      return { ok: true, user }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  // ── 登出 ────────────────────────────────────────────────────────────────────
  logout: async () => {
    try { await client.post('/auth/logout') } catch { /* ignore */ }
    tokenManager.remove()
    localStorage.removeItem('pm_refresh_token')
    set({ user: null, loggedIn: false })
    // 停掉 conversations polling，避免登出後繼續發 auth 請求
    import('./useConversationStore').then(({ useConversationStore }) => {
      useConversationStore.getState().teardown()
    })
  },

  // ── 忘記密碼（尚未實作後端寄信功能）────────────────────────────────────────
  resetPassword: async (_email) => {
    return { ok: false, error: '重設密碼功能尚未開放，請聯絡客服' }
  },

  // ── 更新個人資料 ────────────────────────────────────────────────────────────
  updateProfile: async (patch) => {
    const user = get().user
    if (!user) return { ok: false, error: '請先登入' }

    const nextName = (patch.displayName ?? patch.name)?.trim() || null
    const normalizedPatch = {
      ...patch,
      ...(nextName ? { name: nextName } : {}),
    }
    delete normalizedPatch.displayName
    delete normalizedPatch.id

    try {
      const updated = await client.patch('/users/me', normalizedPatch)
      const next = { ...user, ...updated, displayName: updated.name }
      set({ user: next })
      return { ok: true, user: next }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  // ── 調整信用分數（後端業務操作中自動處理，前端只需同步本地狀態）────────────
  adjustCreditScore: async (_userId, _delta) => {
    return null
  },
}))
