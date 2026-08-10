import client from './axiosClient'

export async function getUserProfile(userId) {
  return client.get(`/users/${userId}`)
}

// 管理員依 email 查詢使用者（單發系統訊息前先確認對象是誰）
export async function findUserByEmail(email) {
  return client.get('/users', { params: { email } })
}

export async function fetchCreditHistory() {
  return client.get('/users/me/credit-history')
}
