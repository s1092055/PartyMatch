import { readAllFavorites, insertFavorite, deleteFavoriteById } from '../api/favoritesApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'

let _favs = []

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export async function initFavorites() {
  const all = await readAllFavorites()
  _favs = DEMO_MODE ? all : all.filter(f => !f._demo)
}

export function getFavoritesByUserId(userId) {
  return _favs.filter(f => f.userId === userId)
}

export function isGroupFavorited(userId, groupId) {
  return _favs.some(f => f.userId === userId && f.groupId === groupId)
}

export function toggleFavorite(userId, groupId) {
  if (isGroupFavorited(userId, groupId)) {
    removeFavorite(userId, groupId)
    return false
  }
  const fav = { id: createId('fav'), userId, groupId, createdAt: todayISO() }
  _favs.push(fav)
  insertFavorite(fav).catch(console.error)
  return true
}

export function removeFavorite(userId, groupId) {
  const fav = _favs.find(f => f.userId === userId && f.groupId === groupId)
  if (!fav) return
  _favs = _favs.filter(f => !(f.userId === userId && f.groupId === groupId))
  deleteFavoriteById(fav.id).catch(console.error)
}
