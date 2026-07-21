import client from './axiosClient'

export async function getUserProfile(userId) {
  return client.get(`/users/${userId}`)
}
