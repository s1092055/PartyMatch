import { create } from 'zustand'
import { SERVICES } from '../data/serviceCatalog'
import { readAllServices } from '../api/servicesApi'

export const useServiceStore = create((set, get) => ({
  // 先用本地 catalog 作為初始值，API 回應後覆蓋
  services: [...SERVICES],
  loading:  false,
  error:    null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const data = await readAllServices()
      if (data.length > 0) {
        // 將 API 資料與本地 catalog 合併：API 補充後端欄位，local 保留 iconId/color/initial 等圖示欄位
        const localMap = Object.fromEntries(SERVICES.map(s => [s.id, s]))
        const merged = data.map(apiService => {
          const base = { ...(localMap[apiService.id] ?? {}), ...apiService }
          // 後端 plan 只有 id/name/maxMembers/monthlyFee/currency，沒有 description/features 等文案欄位；
          // 本地 catalog 的方案沒有 id 欄位，只能用 name 對應回去補回文案，價格/名額仍以後端為準。
          // name 比對不保證唯一或一定對得上，用 console.warn 讓比對失敗在開發時可被發現，而不是默默漏字。
          if (Array.isArray(base.plans)) {
            const localPlans = localMap[apiService.id]?.plans ?? []
            const localPlanMap = {}
            for (const p of localPlans) {
              if (import.meta.env.DEV && localPlanMap[p.name]) {
                console.warn(`[serviceStore] "${apiService.id}" 有重複的方案名稱「${p.name}」，本地文案比對可能會對到錯的方案`)
              }
              localPlanMap[p.name] = p
            }
            base.plans = base.plans.map(p => {
              const localPlan = localPlanMap[p.name]
              if (import.meta.env.DEV && !localPlan) {
                console.warn(`[serviceStore] "${apiService.id}" 的方案「${p.name}」在本地 catalog 找不到對應項目，將不會有 description/features 文案`)
              }
              return {
                ...(localPlan ?? {}),
                ...p,
                maxSeats:     p.maxSeats     ?? p.maxMembers ?? 0,
                monthlyPrice: p.monthlyPrice ?? p.monthlyFee ?? 0,
              }
            })
          }
          return base
        })
        set({ services: merged.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)), loading: false })
      } else {
        set({ loading: false })
      }
    } catch (err) {
      console.warn('[serviceStore] API unavailable, using local catalog:', err.message)
      set({ loading: false })
    }
  },

  getById:       (id)       => get().services.find(s => s.id === id) ?? null,
  getByCategory: (category) => get().services.filter(s => s.category === category),
  getCategories: ()         => [...new Set(get().services.map(s => s.category))],
}))
