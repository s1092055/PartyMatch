import { create } from 'zustand'

export const usePendingRefreshStore = create((set) => ({
  pending: new Set(),
  pendingGroupIds: new Set(),
  refreshTick: 0,

  mark: (stores, groupId) => set(s => {
    const next = new Set(s.pending)
    stores.forEach(store => next.add(store))
    const nextGroupIds = new Set(s.pendingGroupIds)
    if (groupId) nextGroupIds.add(groupId)
    return { pending: next, pendingGroupIds: nextGroupIds }
  }),

  clear: () => set({ pending: new Set(), pendingGroupIds: new Set() }),

  clearGroup: (groupId) => set(s => {
    if (!groupId || !s.pendingGroupIds.has(groupId)) return s
    const next = new Set(s.pendingGroupIds)
    next.delete(groupId)
    return { pendingGroupIds: next }
  }),

  bumpRefreshTick: () => set(s => ({ refreshTick: s.refreshTick + 1 })),
}))
