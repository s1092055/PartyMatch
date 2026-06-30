import { create } from 'zustand'
import {
  readAllSubscriptions,
  insertSubscription,
  patchSubscription,
  deleteSubscriptionRecord,
} from '../api/subscriptionsApi'
import { normalizeSubscription } from '../utils/modelNormalizers'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'

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

  // ── 建立訂閱（已存在則回傳既有）──────────────────────────────────────────────
  create: (data) => {
    const { userId, groupId, serviceName, planName, serviceId, hostName, hostAvatarInitial, hostAvatarColor, pricePerSeat, billingCycle, nextBillingDate } = data
    const existing = get().getByUserAndGroup(userId, groupId)
    if (existing) return existing
    const now = todayISO()
    const sub = normalizeSubscription({
      id:               createId('sub'),
      userId,
      groupId,
      serviceName,
      planName,
      serviceId,
      hostName,
      hostAvatarInitial,
      hostAvatarColor,
      pricePerSeat,
      billingCycle,
      nextBillingDate,
      joinedAt:         now,
      paymentStatus:    'pending',
      status:           'pending_payment',
      createdAt:        now,
      updatedAt:        now,
    })
    set(s => ({ subscriptions: [...s.subscriptions, sub] }))
    insertSubscription(sub).catch(console.error)
    return sub
  },

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

  // ── 標記付款 ────────────────────────────────────────────────────────────────
  markPaid: (id) => get().update(id, { status: 'markedPaid' }),

  // ── 確認收款 ────────────────────────────────────────────────────────────────
  confirmPayment: (id) => get().update(id, { status: 'confirmed' }),

  // ── 重設付款狀態 ────────────────────────────────────────────────────────────
  resetPayment: (id) => get().update(id, { status: 'pending' }),

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

  // ── 重設群組所有訂閱付款狀態（續訂用）──────────────────────────────────────
  resetPaymentsForGroup: (groupId) => {
    const patch = { status: 'pending' }
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
