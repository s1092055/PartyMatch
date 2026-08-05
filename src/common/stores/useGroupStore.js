import { create } from 'zustand'
import {
  readAllGroups,
  insertGroup,
  fetchGroupById,
  patchGroup,
  lockGroupApi,
  activateGroupApi,
  confirmGroupApi,
  cancelGroupApi,
  disputeGroupApi,
  adjudicateGroupApi,
  renewGroupApi,
  adjustBillingDateApi,
} from '../api/groupsApi'
import { normalizeGroup } from '../utils/modelNormalizers'
import { createId } from '../utils/storage'
import { todayISO, byNewest } from '../utils/date'
import { notifyError } from '../utils/toast'

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

  // 重新查詢單一群組（觸發後端確認期逾期自動撥款的惰性檢查），開啟群組詳情時呼叫
  refreshGroup: async (id) => {
    const updated = await fetchGroupById(id)
    set(s => ({ groups: s.groups.map(g => g.id === id ? normalizeGroup({ ...g, ...updated }) : g) }))
    return updated
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getById:      (id)     => get().groups.find(g => g.id === id) ?? null,
  getByHostId:  (hostId) => get().groups
    .filter(g => g.hostId === hostId)
    .sort(byNewest),
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
    }).catch(err => {
      // 後端建立失敗時移除樂觀新增的本地群組，避免留下一筆伺服器端不存在的假群組
      set(s => ({ groups: s.groups.filter(g => g.id !== group.id), error: err.message }))
      notifyError(err, '群組建立失敗，請稍後再試')
    })
    return group
  },

  // ── 更新群組（樂觀更新本地 state，同步 PATCH 至後端）────────────────────────
  update: (id, patch) => {
    const prior = get().groups.find(g => g.id === id) ?? null
    let updated = null
    set(s => ({
      groups: s.groups.map(g => {
        if (g.id !== id) return g
        updated = normalizeGroup({ ...g, ...patch })
        return updated
      }),
    }))
    patchGroup(id, patch).catch(err => {
      // 回滾至先前值，避免畫面顯示的群組狀態跟後端真實狀態不一致
      if (prior) set(s => ({ groups: s.groups.map(g => g.id === id ? prior : g) }))
      notifyError(err, '群組更新失敗，請稍後再試')
    })
    return updated
  },

  // ── 鎖定群組（full → pending_confirmation），後端同步設定 nextBillingDate ──────
  lockGroup: async (id, sharedCredentials) => {
    const updated = await lockGroupApi(id, sharedCredentials)
    set(s => ({
      groups: s.groups.map(g => g.id === id ? normalizeGroup({ ...g, ...updated }) : g),
    }))
    return updated
  },

  // ── 啟用服務（pending_activation → confirming），後端設定 confirmDeadline ──────
  activateService: async (id) => {
    const updated = await activateGroupApi(id)
    set(s => ({
      groups: s.groups.map(g => g.id === id ? normalizeGroup({ ...g, ...updated }) : g),
    }))
    return updated
  },

  // ── 確認服務（confirming → active，若全員確認則釋出代管）──────────────────────
  confirmService: async (id) => {
    const res = await confirmGroupApi(id)
    if (res.released && res.group) {
      set(s => ({
        groups: s.groups.map(g => g.id === id ? normalizeGroup({ ...g, ...res.group }) : g),
      }))
    }
    return res
  },

  // ── 確認期調整下次扣款日（每期僅能調整一次，只能延後，見後端 /billing-date 的規則）────
  adjustBillingDate: async (id, payload) => {
    const updated = await adjustBillingDateApi(id, payload)
    set(s => ({
      groups: s.groups.map(g => g.id === id ? normalizeGroup({ ...g, ...updated }) : g),
    }))
    return updated
  },

  // ── 申訴（confirming → disputed）─────────────────────────────────────────────
  disputeGroup: async (id, payload) => {
    const updated = await disputeGroupApi(id, payload)
    set(s => ({
      groups: s.groups.map(g => g.id === id ? normalizeGroup({ ...g, ...updated }) : g),
    }))
    return updated
  },

  // ── 解散群組（→ cancelled，退還所有代管）──────────────────────────────────────
  cancelGroup: async (id) => {
    await cancelGroupApi(id)
    set(s => ({
      groups: s.groups.map(g => g.id === id ? { ...g, status: 'cancelled', escrowTokens: 0 } : g),
    }))
  },

  // ── 本地狀態更新（不呼叫後端，供 fillServiceInfo 自動推進使用）──────────────────
  setGroupStatus: (id, status) => {
    set(s => ({
      groups: s.groups.map(g => g.id === id ? { ...g, status } : g),
    }))
  },

  // ── 開始新一期（active → pending_confirmation，後端同步重置成員帳號資訊）──────
  startRenewalCycle: async (id) => {
    const updated = await renewGroupApi(id)
    set(s => ({
      groups: s.groups.map(g => g.id === id ? normalizeGroup({ ...g, ...updated }) : g),
    }))
    return updated
  },

  // ── 裁定申訴（管理員）──────────────────────────────────────────────────────
  adjudicateGroup: async (id, payload) => {
    const res = await adjudicateGroupApi(id, payload)
    // 裁定會連動變更成員名單／代管餘額／訂閱狀態（見 server/src/routes/groups.js 的 winner 分支），
    // 不能只靠本地假設把 status 設回 active；直接重新 init 換回真實狀態，
    // 避免依賴呼叫端（管理後台）記得手動刷新
    const [{ useMemberStore }, { useSubscriptionStore }] = await Promise.all([
      import('./useMemberStore'),
      import('./useSubscriptionStore'),
    ])
    await Promise.all([
      get().init({ all: true }),
      useMemberStore.getState().init(),
      useSubscriptionStore.getState().init(),
    ])
    return res
  },

  // ── 結束群組 ────────────────────────────────────────────────────────────────
  endGroup: (id) => get().update(id, { status: 'ended' }),
}))
