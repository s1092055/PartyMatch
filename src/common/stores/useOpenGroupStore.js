import { create } from 'zustand'

// 記錄目前開著的是哪個群組的 Modal（團主端 hostOpenGroupId 同步 HostGroupModalHost
// 的 viewGroupId；成員端 memberOpenGroupId 同步全站共用的 GroupDetailModal），
// 讓背景 polling 決定要不要跳 toast、或使用者自己打開 Modal 時要不要收掉
// 已經顯示的 toast，可以判斷「使用者是不是已經在看這個群組了」
export const useOpenGroupStore = create((set) => ({
  hostOpenGroupId: null,
  memberOpenGroupId: null,
  setHostOpenGroupId: (id) => set({ hostOpenGroupId: id }),
  setMemberOpenGroupId: (id) => set({ memberOpenGroupId: id }),
}))
