import { create } from 'zustand'
import {
  readAllMembers,
  patchMember,
  deleteMemberRecord,
} from '../api/membersApi'
import { normalizeMember } from '../utils/modelNormalizers'
import { notifyError } from '../utils/toast'
// useGroupStore/useAuthStore 對 useMemberStore 的依賴一律是動態 import（見 useGroupStore.js／useAuthStore.js），
// 所以這邊可以放心靜態 import，不會形成真正的循環依賴
import { useGroupStore } from './useGroupStore'

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

  // ── 填寫服務帳號（pending_confirmation 階段，或團主回報帳號問題後的重新填寫）──────
  fillServiceInfo: async (memberId, groupId, serviceInfo) => {
    const prior = get().members.find(m => m.id === memberId) ?? null
    // 重新送出服務帳號資訊等於「我已經修正了」，一定要順便清掉團主回報的帳號問題，
    // 不然 serviceInfoIssueNote 永遠不會消失——之前沒清的話，這個成員會卡在「有未解決問題」，
    // 團主端 allMembersChecked 永遠算不過，群組永遠無法啟用服務
    set(s => ({
      members: s.members.map(m => m.id === memberId
        ? { ...m, serviceInfo, serviceInfoIssueNote: null, serviceInfoIssueEvidenceUrl: null }
        : m),
    }))
    try {
      const res = await patchMember(memberId, { serviceInfo, serviceInfoIssueNote: null, serviceInfoIssueEvidenceUrl: null })
      if (res?._groupAdvanced) {
        // 全員填完，後端已自動推進群組狀態
        useGroupStore.getState().setGroupStatus(groupId, res._groupAdvanced)
      }
      // service_info_filled 通知（團主）已經由後端 PATCH /members/:id 建立
    } catch (err) {
      // 回滾至先前值，而非清空
      set(s => ({
        members: s.members.map(m => m.id === memberId
          ? (prior ? { ...m, ...prior } : m)
          : m),
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
  // 回傳 deleteMemberRecord 的 promise，讓呼叫端可以在真的移除成功後，
  // 再去同步後端計算過的代管退款結果（group.escrowTokens），不會是必要，
  // 但呼叫端若不 await 也不影響這裡的樂觀更新／失敗回滾行為
  remove: (memberId) => {
    const prior = get().members.find(m => m.id === memberId) ?? null
    set(s => ({ members: s.members.filter(m => m.id !== memberId) }))
    return deleteMemberRecord(memberId).catch(err => {
      if (prior) set(s => ({ members: [...s.members, prior] }))
      notifyError(err, '移除成員失敗，請稍後再試')
      throw err
    })
  },

}))
