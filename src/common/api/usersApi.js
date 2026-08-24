import client from './axiosClient'

export async function getUserProfile(userId) {
  return client.get(`/users/${userId}`)
}

export async function findUserByEmail(email) {
  return client.get('/users', { params: { email } })
}

export async function fetchCreditHistory() {
  return client.get('/users/me/credit-history')
}
