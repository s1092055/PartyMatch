import { create } from 'zustand'
import {
  readAllGroups,
  insertGroup,
  patchGroup,
  lockGroupApi,
} from '../api/groupsApi'
import { normalizeGroup } from '../utils/modelNormalizers'
import { createId } from '../utils/storage'
import { toISODate, todayISO } from '../utils/date'

export const useGroupStore = create((set, get) => ({
  groups:  [],
  loading: false,
  error:   null,

  // ── 初始化 ──────────────────────────────────────────────────────────────────
  // all=true 時取得所有群組（含 active/full 等），供已登入用戶使用
  init: async ({ all = false } = {}) => {
    set({ loading: true, error: null })
    try {
      const groups = await readAllGroups(all ? { status: 'all' } : { status: 'recruiting' })
      set({ groups: groups.map(normalizeGroup), loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getById:      (id)     => get().groups.find(g => g.id === id) ?? null,
  getByHostId:  (hostId) => get().groups
    .filter(g => g.hostId === hostId)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
  getRecruiting: ()      => get().groups.filter(g => g.status === 'recruiting'),

  // ── 建立群組 ────────────────────────────────────────────────────────────────
  create: (data, host) => {
    if (!host) throw new Error('登入後才能建立群組')
    const now = todayISO()
    const group = normalizeGroup({
      id:                createId(`group_${data.serviceId}`),
      hostId:            host.id,
      hostName:          host.displayName,
      hostRating:        host.creditScore,
      hostReviewCount:   0,
      hostAvatarInitial: host.avatarInitial,
      hostAvatarColor:   host.avatarColor,
      status:            'recruiting',
      createdAt:         now,
      updatedAt:         now,
      usedSeats:         1,
      openSeats:         (data.totalSeats ?? 6) - 1,
      tags:              [],
      rules:             [],
      reviews:           [],
      requirements:      null,
      description:       '',
      ...data,
    })
    set(s => ({ groups: [...s.groups, group] }))
    insertGroup(group).then(saved => {
      if (saved?.id) {
        const normalized = normalizeGroup({ ...saved })
        set(s => ({ groups: s.groups.map(g => g.id === group.id ? normalized : g) }))
      }
    }).catch(err => console.error('[groupStore] create failed:', err))
    return group
  },

  // ── 更新群組（樂觀更新本地 state，同步 PATCH 至後端）────────────────────────
  update: (id, patch) => {
    let updated = null
    set(s => ({
      groups: s.groups.map(g => {
        if (g.id !== id) return g
        updated = normalizeGroup({ ...g, ...patch })
        return updated
      }),
    }))
    patchGroup(id, patch).catch(err => console.error('[groupStore] update failed:', err))
    return updated
  },

  // ── 鎖定群組（full → pending_confirmation），後端同步設定 nextBillingDate ──────
  lockGroup: async (id) => {
    const updated = await lockGroupApi(id)
    set(s => ({
      groups: s.groups.map(g => g.id === id ? normalizeGroup({ ...g, ...updated }) : g),
    }))
    return updated
  },

  // ── 啟用聊天室（full → pending_confirmation）─────────────────────────────────
  activateGroupChat: (id) => get().update(id, { status: 'pending_confirmation' }),

  // ── 確認收款完成（pending_confirmation → pending_activation）──────────────────
  confirmGroupPayments: (id) => get().update(id, { status: 'pending_activation' }),

  // ── 啟用群組服務（pending_activation → active）───────────────────────────────
  activateGroup: (id, customNextBillingDate = null) => {
    const group = get().getById(id)
    if (!group) return null
    const activatedAt = todayISO()
    let nextBillingDate = customNextBillingDate
    if (!nextBillingDate) {
      const d = new Date(activatedAt)
      if (group.billingCycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
      else d.setMonth(d.getMonth() + 1)
      nextBillingDate = toISODate(d)
    }
    return get().update(id, { status: 'active', activatedAt, nextBillingDate })
  },

  // ── 開始續訂週期（→ pending_confirmation，推進下次扣款日）─────────────────────
  startRenewalCycle: (id) => {
    const group = get().getById(id)
    if (!group) return null
    const base = new Date(group.nextBillingDate ?? todayISO())
    if (group.billingCycle === 'yearly') base.setFullYear(base.getFullYear() + 1)
    else base.setMonth(base.getMonth() + 1)
    return get().update(id, { status: 'pending_confirmation', nextBillingDate: toISODate(base) })
  },

  // ── 結束群組 ────────────────────────────────────────────────────────────────
  endGroup: (id) => get().update(id, { status: 'ended' }),
}))
