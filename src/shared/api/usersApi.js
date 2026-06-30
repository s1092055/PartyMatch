import client from './axiosClient'

export async function getUserProfile(userId) {
  return client.get(`/users/${userId}`)
}

export async function upsertUserProfile(_userId, profile) {
  return client.patch('/users/me', profile)
}

export async function patchUserCreditScore(_userId, _delta) {
  // 信用分數由後端在業務操作中自動更新，前端無需直接呼叫
  return null
}
