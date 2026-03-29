import { create } from 'zustand'
import { readAllFavorites, toggleFavorite } from '../api/favoritesApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { notifyError } from '../utils/toast'

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

  getByUserId: (userId) => get().favorites.filter(f => f.userId === userId),

  isFavorited: (userId, groupId) =>
    get().favorites.some(f => f.userId === userId && f.groupId === groupId),

  toggle: (userId, groupId) => {
    const existing = get().favorites.find(f => f.userId === userId && f.groupId === groupId)
    if (existing) {
      set(s => ({ favorites: s.favorites.filter(f => f.id !== existing.id) }))
      toggleFavorite(groupId).catch(err => {
        set(s => ({ favorites: [...s.favorites, existing] }));
        notifyError(err, '收藏失敗，請稍後再試')
      })
      return false
    }
    const fav = { id: createId('fav'), userId, groupId, createdAt: todayISO() }
    set(s => ({ favorites: [...s.favorites, fav] }))
    toggleFavorite(groupId).catch(err => {
      set(s => ({ favorites: s.favorites.filter(f => f.id !== fav.id) }))
      notifyError(err, '收藏失敗，請稍後再試')
    })
    return true
  },
}))
