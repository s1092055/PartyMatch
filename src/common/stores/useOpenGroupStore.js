import { create } from 'zustand'

// 記錄團主端目前開著的是哪個群組的 Modal（HostGroupModalHost 是全站掛載的單一
// 實例，這裡單純同步它的 viewGroupId），讓背景 polling 決定要不要跳 toast 時
// 可以判斷「使用者是不是已經正在看這個群組了」，不用再另外彈一次
export const useOpenGroupStore = create((set) => ({
  hostOpenGroupId: null,
  setHostOpenGroupId: (id) => set({ hostOpenGroupId: id }),
}))
