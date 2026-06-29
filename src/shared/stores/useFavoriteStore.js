import { create } from 'zustand'
import { readAllFavorites, insertFavorite, deleteFavoriteById } from '../api/favoritesApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'

export const useFavoriteStore = create((set, get) => ({
  favorites: [],
  loading:   false,
  error:     null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const favorites = await readAllFavorites()
      set({ favorites, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getByUserId: (userId) => get().favorites.filter(f => f.userId === userId),

  isFavorited: (userId, groupId) =>
    get().favorites.some(f => f.userId === userId && f.groupId === groupId),

  // ── Toggle 收藏（回傳新的收藏狀態）──────────────────────────────────────────
  toggle: (userId, groupId) => {
    const existing = get().favorites.find(f => f.userId === userId && f.groupId === groupId)
    if (existing) {
      set(s => ({ favorites: s.favorites.filter(f => f.id !== existing.id) }))
      deleteFavoriteById(existing.id).catch(console.error)
      return false
    }
    const fav = { id: createId('fav'), userId, groupId, createdAt: todayISO() }
    set(s => ({ favorites: [...s.favorites, fav] }))
    insertFavorite(fav).catch(console.error)
    return true
  },
}))
