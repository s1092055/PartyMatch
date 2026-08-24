import { create } from 'zustand'
import {
  readAllSubscriptions,
  patchSubscription,
  deleteSubscriptionRecord,
} from '../api/subscriptionsApi'
import { normalizeSubscription } from '../utils/modelNormalizers'
import { notifyError } from '../utils/toast'

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

  getByGroupId: (groupId) => get().subscriptions.filter(s => s.groupId === groupId),
  getByUserId:  (userId)  => get().subscriptions.filter(s => s.userId === userId),
  getByUserAndGroup: (userId, groupId) =>
    get().subscriptions.find(s => s.userId === userId && s.groupId === groupId) ?? null,

  update: (id, patch) => {
    const prior = get().subscriptions.find(sub => sub.id === id) ?? null
    let updated = null
    set(s => ({
      subscriptions: s.subscriptions.map(sub => {
        if (sub.id !== id) return sub
        updated = normalizeSubscription({ ...sub, ...patch })
        return updated
      }),
    }))
    patchSubscription(id, patch).catch(err => {
      if (prior) set(s => ({ subscriptions: s.subscriptions.map(sub => sub.id === id ? prior : sub) }))
      notifyError(err, '訂閱更新失敗，請稍後再試')
    })
    return updated
  },

  activateGroupSubscriptions: (groupId, nextBillingDate) => {
    const patch = { status: 'active', nextBillingDate }
    const priors = get().subscriptions.filter(s => s.groupId === groupId)
    set(s => ({
      subscriptions: s.subscriptions.map(sub =>
        sub.groupId === groupId ? normalizeSubscription({ ...sub, ...patch }) : sub
      ),
    }))
    Promise.all(priors.map(s => patchSubscription(s.id, patch))).catch(err => {
      set(s => ({
        subscriptions: s.subscriptions.map(sub => priors.find(p => p.id === sub.id) ?? sub),
      }));
      notifyError(err, '訂閱啟用失敗，請稍後再試')
    })
  },

  remove: (id) => {
    const prior = get().subscriptions.find(sub => sub.id === id) ?? null
    set(s => ({ subscriptions: s.subscriptions.filter(sub => sub.id !== id) }))
    deleteSubscriptionRecord(id).catch(err => {
      if (prior) set(s => ({ subscriptions: [...s.subscriptions, prior] }))
      notifyError(err, '刪除訂閱失敗，請稍後再試')
    })
  },
}))
