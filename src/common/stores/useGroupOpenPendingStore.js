import { create } from 'zustand'

export const useGroupOpenPendingStore = create((set) => ({
  pendingGroupId: null,
  setPendingGroupId: (id) => set({ pendingGroupId: id }),
}))
