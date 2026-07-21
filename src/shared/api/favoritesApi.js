import client from './axiosClient'

export async function readAllFavorites() {
  return client.get('/favorites')
}

export async function toggleFavorite(groupId) {
  return client.post(`/favorites/${groupId}`)
}
