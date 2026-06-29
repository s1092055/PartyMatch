import { create } from 'zustand'
import { SERVICES } from '../data/serviceCatalog'
import { readAllServices } from '../api/servicesApi'

export const useServiceStore = create((set, get) => ({
  // 先用本地 catalog，讓 Firestore 回應前服務資料就可用
  services: [...SERVICES],
  loading:  false,
  error:    null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const data = await readAllServices()
      if (data.length > 0) {
        set({ services: data.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)), loading: false })
      } else {
        set({ loading: false })
      }
    } catch (err) {
      console.warn('[serviceStore] Firestore unavailable, using local catalog:', err.message)
      set({ loading: false })
    }
  },

  getById:       (id)       => get().services.find(s => s.id === id) ?? null,
  getByCategory: (category) => get().services.filter(s => s.category === category),
  getCategories: ()         => [...new Set(get().services.map(s => s.category))],
}))
