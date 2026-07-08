import { create } from 'zustand'
import {
  readAllSubscriptions,
  patchSubscription,
  deleteSubscriptionRecord,
} from '../api/subscriptionsApi'
import { normalizeSubscription } from '../utils/modelNormalizers'

export const useSubscriptionStore = create((set, get) => ({
  subscriptions: [],
  loading:       false,
  error:         null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const subscriptions = await readAllSubscriptions()
      set({ subscriptions: subscriptions.map(normalizeSubscription), loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getByGroupId: (groupId) => get().subscriptions.filter(s => s.groupId === groupId),
  getByUserId:  (userId)  => get().subscriptions.filter(s => s.userId === userId),
  getByUserAndGroup: (userId, groupId) =>
    get().subscriptions.find(s => s.userId === userId && s.groupId === groupId) ?? null,

  // ── 更新 ────────────────────────────────────────────────────────────────────
  update: (id, patch) => {
    let updated = null
    set(s => ({
      subscriptions: s.subscriptions.map(sub => {
        if (sub.id !== id) return sub
        updated = normalizeSubscription({ ...sub, ...patch })
        return updated
      }),
    }))
    patchSubscription(id, patch).catch(console.error)
    return updated
  },

  // ── 啟用群組所有訂閱 ────────────────────────────────────────────────────────
  activateGroupSubscriptions: (groupId, nextBillingDate) => {
    const patch = { status: 'active', nextBillingDate }
    const targets = get().subscriptions.filter(s => s.groupId === groupId)
    set(s => ({
      subscriptions: s.subscriptions.map(sub =>
        sub.groupId === groupId ? normalizeSubscription({ ...sub, ...patch }) : sub
      ),
    }))
    targets.forEach(s => patchSubscription(s.id, patch).catch(console.error))
  },

  // ── 移除 ────────────────────────────────────────────────────────────────────
  remove: (id) => {
    set(s => ({ subscriptions: s.subscriptions.filter(sub => sub.id !== id) }))
    deleteSubscriptionRecord(id).catch(console.error)
  },
}))
