import { create } from 'zustand'

export const useModalStackStore = create((set) => ({
  count: 0,
  push: () => set(s => ({ count: s.count + 1 })),
  pop:  () => set(s => ({ count: Math.max(0, s.count - 1) })),
}))
