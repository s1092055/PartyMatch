import { create } from 'zustand'
import {
  readAllMembers,
  insertMember,
  patchMember,
  deleteMemberRecord,
} from '../api/membersApi'
import { normalizeMember } from '../utils/modelNormalizers'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'

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

  // ── 加入 ────────────────────────────────────────────────────────────────────
  create: ({ groupId, groupName, userId, userName, userAvatarInitial, userAvatarColor, skipApiCall = false }) => {
    const member = {
      id:               createId('mem'),
      groupId,
      groupName,
      userId,
      userName,
      userAvatarInitial,
      userAvatarColor,
      role:             'member',
      joinedAt:         todayISO(),
      paymentStatus:    'pending',
      lastPaidAt:       null,
    }
    set(s => ({ members: [...s.members, member] }))
    if (!skipApiCall) insertMember(member).catch(console.error)
    return member
  },

  // ── 更新成員（付款狀態、服務帳號、付款憑證等）────────────────────────────────
  update: (memberId, patch) => {
    set(s => ({
      members: s.members.map(m => m.id === memberId ? { ...m, ...patch } : m),
    }))
    return patchMember(memberId, patch).catch(console.error)
  },

  // ── 移除 ────────────────────────────────────────────────────────────────────
  remove: (memberId) => {
    set(s => ({ members: s.members.filter(m => m.id !== memberId) }))
    deleteMemberRecord(memberId).catch(console.error)
  },

  // ── 重設群組成員付款狀態（續訂用）────────────────────────────────────────────
  resetPaymentsForGroup: (groupId) => {
    const patch = { paymentStatus: 'pending' }
    const targets = get().members.filter(m => m.groupId === groupId)
    set(s => ({
      members: s.members.map(m => m.groupId === groupId ? { ...m, ...patch } : m),
    }))
    targets.forEach(m => patchMember(m.id, patch).catch(console.error))
  },
}))
