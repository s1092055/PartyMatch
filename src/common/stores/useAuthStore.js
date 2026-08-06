import { create } from 'zustand'
import client, { tokenManager } from '../api/axiosClient'
import { fetchTokenBalance, topupTokens } from '../api/tokensApi'

// 登入 / 註冊後才初始化需要 auth 的 stores，避免未登入時呼叫受保護端點
async function initPrivateStores(userId) {
  const [
    { useApplicationStore },
    { useSubscriptionStore },
    { useMemberStore },
    { useFavoriteStore },
    { useConversationStore },
    { useNotificationStore },
    { useGroupStore },
  ] = await Promise.all([
    import('./useApplicationStore'),
    import('./useSubscriptionStore'),
    import('./useMemberStore'),
    import('./useFavoriteStore'),
    import('./useConversationStore'),
    import('./useNotificationStore'),
    import('./useGroupStore'),
  ])
  await Promise.all([
    useGroupStore.getState().init({ all: true }),
    useApplicationStore.getState().init(),
    useSubscriptionStore.getState().init(),
    useMemberStore.getState().init(),
    useFavoriteStore.getState().init(),
    useNotificationStore.getState().init(),
  ])
  useConversationStore.getState().init(userId)
  useNotificationStore.getState().startPolling(userId)
}

async function clearPrivateStores() {
  const [
    { useApplicationStore },
    { useSubscriptionStore },
    { useMemberStore },
    { useFavoriteStore },
    { useConversationStore },
    { useNotificationStore },
    { useGroupStore },
  ] = await Promise.all([
    import('./useApplicationStore'),
    import('./useSubscriptionStore'),
    import('./useMemberStore'),
    import('./useFavoriteStore'),
    import('./useConversationStore'),
    import('./useNotificationStore'),
    import('./useGroupStore'),
  ])
  useConversationStore.getState().teardown()
  useNotificationStore.getState().teardown()
  useApplicationStore.setState({ applications: [] })
  useSubscriptionStore.setState({ subscriptions: [] })
  useMemberStore.setState({ members: [] })
  useFavoriteStore.setState({ favorites: [] })
  // 登入時 init({ all: true }) 會帶入所有群組（含非招募中的權限資料），登出不會重新整理頁面，
  // 必須重新 init({ all: false }) 換回訪客可見的招募中群組，避免同分頁下一位訪客／使用者
  // 在 App 重新掛載前，看到前一位使用者的完整群組列表（含他人非公開的群組狀態）
  useGroupStore.getState().init({ all: false }).catch(console.error)
}

function activeProfile(user) {
  if (!user) return null
  const displayName = user.displayName?.trim() || user.name?.trim() || '使用者'
  const joinedAt = user.joinedAt ?? String(user.createdAt ?? '').slice(0, 10)
  return {
    ...user,
    displayName,
    joinedAt,
    avatarInitial: user.avatarInitial ?? null,
    avatarColor:   user.avatarColor ?? null,
    showAvatar:    user.showAvatar ?? true,
    presenceStatus: user.presenceStatus ?? 'online',
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

  // ── PM幣 ────────────────────────────────────────────────────────────────────
  refreshTokenBalance: async () => {
    try {
      const { tokenBalance } = await fetchTokenBalance()
      set(s => ({ user: s.user ? { ...s.user, tokenBalance } : s.user }))
    } catch { /* silent */ }
  },

  topup: async (amount) => {
    const { tokenBalance } = await topupTokens(amount)
    set(s => ({ user: s.user ? { ...s.user, tokenBalance } : s.user }))
    return tokenBalance
  },

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

  // ── 註冊 ────────────────────────────────────────────────────────────────────
  register: async ({ name, email, password, phone }) => {
    try {
      const { user, accessToken, refreshToken } = await client.post('/auth/register', { name, email, password, phone })
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
    // 清空所有私人 store 狀態，避免下一個用戶看到舊資料
    clearPrivateStores().catch(console.error)
  },

  // ── 停用帳號（軟刪除，需再次輸入密碼確認）──────────────────────────────────
  deactivateAccount: async (password) => {
    try {
      await client.post('/users/me/deactivate', { password })
      tokenManager.remove()
      localStorage.removeItem('pm_refresh_token')
      set({ user: null, loggedIn: false })
      clearPrivateStores().catch(console.error)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
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
