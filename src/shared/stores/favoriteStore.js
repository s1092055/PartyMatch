import { readAllFavorites, insertFavorite, deleteFavoriteRecord } from '../api/favoritesApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'

export function getFavoritesByUserId(userId) {
  return readAllFavorites().filter(f => f.userId === userId)
}

export function isGroupFavorited(userId, groupId) {
  return readAllFavorites().some(f => f.userId === userId && f.groupId === groupId)
}

export function toggleFavorite(userId, groupId) {
  if (isGroupFavorited(userId, groupId)) {
    deleteFavoriteRecord(userId, groupId)
    return false
  }
  insertFavorite({ id: createId('fav'), userId, groupId, createdAt: todayISO() })
  return true
}

export function removeFavorite(userId, groupId) {
  deleteFavoriteRecord(userId, groupId)
}
