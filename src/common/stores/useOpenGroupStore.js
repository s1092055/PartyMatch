import { create } from 'zustand'

export const useOpenGroupStore = create((set) => ({
  hostOpenGroupId: null,
  memberOpenGroupId: null,
  setHostOpenGroupId: (id) => set({ hostOpenGroupId: id }),
  setMemberOpenGroupId: (id) => set({ memberOpenGroupId: id }),
}))
