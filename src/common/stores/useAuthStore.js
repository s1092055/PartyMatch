import { create } from 'zustand'
import client, { tokenManager } from '../api/axiosClient'
import { fetchTokenBalance, topupTokens } from '../api/tokensApi'

async function importPrivateStores() {
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
  return { useApplicationStore, useSubscriptionStore, useMemberStore, useFavoriteStore, useConversationStore, useNotificationStore, useGroupStore }
}

async function initPrivateStores(userId) {
  const {
    useApplicationStore,
    useSubscriptionStore,
    useMemberStore,
    useFavoriteStore,
    useConversationStore,
    useNotificationStore,
    useGroupStore,
  } = await importPrivateStores()
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
  const {
    useApplicationStore,
    useSubscriptionStore,
    useMemberStore,
    useFavoriteStore,
    useConversationStore,
    useNotificationStore,
    useGroupStore,
  } = await importPrivateStores()
  useConversationStore.getState().teardown()
  useNotificationStore.getState().teardown()
  useApplicationStore.setState({ applications: [] })
  useSubscriptionStore.setState({ subscriptions: [] })
  useMemberStore.setState({ members: [] })
  useFavoriteStore.setState({ favorites: [] })
  useGroupStore.getState().init({ all: false }).catch(console.error);
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

  refreshTokenBalance: async () => {
    try {
      const { tokenBalance } = await fetchTokenBalance()
      set(s => ({ user: s.user ? { ...s.user, tokenBalance } : s.user }))
    } catch {}
  },

  topup: async (amount) => {
    const { tokenBalance } = await topupTokens(amount)
    set(s => ({ user: s.user ? { ...s.user, tokenBalance } : s.user }))
    return tokenBalance
  },

  login: async ({ email, password }) => {
    try {
      const { user, accessToken } = await client.post('/auth/login', { email, password })
      tokenManager.set(accessToken)
      set({ user, loggedIn: true })
      await initPrivateStores(user.id)
      return { ok: true, user }
    } catch (err) {
      return { ok: false, error: err.message, code: err.response?.data?.code, recoverable: err.response?.data?.recoverable }
    }
  },

  reactivateAccount: async ({ email, password }) => {
    try {
      const { user, accessToken } = await client.post('/auth/reactivate', { email, password })
      tokenManager.set(accessToken)
      set({ user, loggedIn: true })
      await initPrivateStores(user.id)
      return { ok: true, user }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  register: async ({ name, email, password, phone }) => {
    try {
      const { user, accessToken } = await client.post('/auth/register', { name, email, password, phone })
      tokenManager.set(accessToken)
      set({ user, loggedIn: true })
      await initPrivateStores(user.id)
      return { ok: true, user }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  logout: async () => {
    try { await client.post('/auth/logout') } catch {}
    tokenManager.remove()
    set({ user: null, loggedIn: false })
    clearPrivateStores().catch(console.error);
  },

  deactivateAccount: async (password) => {
    try {
      const { recoveryWindowDays } = await client.post('/users/me/deactivate', { password })
      tokenManager.remove()
      set({ user: null, loggedIn: false })
      clearPrivateStores().catch(console.error)
      return { ok: true, recoveryWindowDays }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

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

  refreshCreditScore: async () => {
    try {
      const user = await client.get('/auth/me')
      set(s => (s.user ? { user: { ...s.user, creditScore: user.creditScore } } : {}))
    } catch {}
  },
}))
