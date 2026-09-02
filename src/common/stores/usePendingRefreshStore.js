import { create } from 'zustand'

export const usePendingRefreshStore = create((set) => ({
  pending: new Set(),      // 待重新整理的 store 名稱，實際刷新資料用
  pendingPages: new Set(), // 待重新整理的內容對應到哪些 nav 頁面，只給紅點顯示用
  refreshTick: 0,          // 每次使用者按下 toast「重新整理」都會 +1，
                           // 頁面把這個值放進列表容器的 key，強制卡片重新掛載、
                           // 重播 slide-up 動畫，而不是只有資料在背後悄悄換掉

  mark: (stores, page) => set(s => {
    const next = new Set(s.pending)
    stores.forEach(store => next.add(store))
    const nextPages = new Set(s.pendingPages)
    if (page) nextPages.add(page)
    return { pending: next, pendingPages: nextPages }
  }),

  clear: () => set(s => ({ pending: new Set(), pendingPages: new Set(), refreshTick: s.refreshTick + 1 })),
}))
