import { create } from 'zustand'
import {
  readAllMembers,
  patchMember,
  deleteMemberRecord,
} from '../api/membersApi'
import { normalizeMember } from '../utils/modelNormalizers'
import { notifyError } from '../utils/toast'

export const useMemberStore = create((set, get) => ({
  members: [],
  loading: false,
  error:   null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const members = await readAllMembers()
      set({ members: members.map(normalizeMember), loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getByGroupId: (groupId) => get().members.filter(m => m.groupId === groupId),

  // 回傳 Set（呼叫端使用 .has()）
  getGroupIds: (userId) => {
    if (!userId) return new Set()
    return new Set(get().members.filter(m => m.userId === userId).map(m => m.groupId))
  },

  isMember: (userId, groupId) =>
    get().members.some(m => m.userId === userId && m.groupId === groupId),

  getByUserAndGroup: (userId, groupId) =>
    get().members.find(m => m.userId === userId && m.groupId === groupId) ?? null,

  // ── 更新成員（付款狀態、服務帳號、付款憑證等）────────────────────────────────
  update: (memberId, patch) => {
    const prior = get().members.find(m => m.id === memberId) ?? null
    set(s => ({
      members: s.members.map(m => m.id === memberId ? { ...m, ...patch } : m),
    }))
    return patchMember(memberId, patch).catch(err => {
      // 回滾至先前值，避免付款狀態／服務帳號等畫面顯示跟後端不同步
      if (prior) set(s => ({ members: s.members.map(m => m.id === memberId ? prior : m) }))
      notifyError(err, '更新失敗，請稍後再試')
    })
  },

  // ── 填寫服務帳號（pending_confirmation 階段）──────────────────────────────────
  fillServiceInfo: async (memberId, groupId, serviceInfo) => {
    const prior = get().members.find(m => m.id === memberId)?.serviceInfo ?? null
    set(s => ({
      members: s.members.map(m => m.id === memberId ? { ...m, serviceInfo } : m),
    }))
    try {
      const res = await patchMember(memberId, { serviceInfo })
      if (res?._groupAdvanced) {
        // 全員填完，後端已自動推進群組狀態
        const { useGroupStore } = await import('./useGroupStore')
        useGroupStore.getState().setGroupStatus(groupId, res._groupAdvanced)
      }
    } catch (err) {
      // 回滾至先前值，而非清空
      set(s => ({
        members: s.members.map(m => m.id === memberId ? { ...m, serviceInfo: prior } : m),
      }))
      throw err
    }
  },

  // ── 新一期開始時清空整個群組的帳號資訊（後端已重置）────────────────────────────
  clearGroupServiceInfos: (groupId) => {
    set(s => ({
      members: s.members.map(m =>
        m.groupId === groupId ? { ...m, serviceInfo: null, serviceInfoIssueNote: null, confirmedAt: null } : m
      ),
    }))
  },

  // ── 確認服務（本地標記 confirmedAt，不呼叫後端）──────────────────────────────
  markConfirmed: (memberId) => {
    set(s => ({
      members: s.members.map(m => m.id === memberId ? { ...m, confirmedAt: new Date().toISOString() } : m),
    }))
  },

  // ── 移除 ────────────────────────────────────────────────────────────────────
  remove: (memberId) => {
    const prior = get().members.find(m => m.id === memberId) ?? null
    set(s => ({ members: s.members.filter(m => m.id !== memberId) }))
    deleteMemberRecord(memberId).catch(err => {
      if (prior) set(s => ({ members: [...s.members, prior] }))
      notifyError(err, '移除成員失敗，請稍後再試')
    })
  },

}))
