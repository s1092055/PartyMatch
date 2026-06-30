import client from './axiosClient'

export async function readAllFavorites() {
  return client.get('/favorites')
}

export async function toggleFavorite(groupId) {
  return client.post(`/favorites/${groupId}`)
}

export async function insertFavorite(record) {
  return toggleFavorite(record.groupId)
}

export async function deleteFavoriteById(id) {
  return client.delete(`/favorites/${id}`)
}
