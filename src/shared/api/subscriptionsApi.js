import client from './axiosClient'

export async function readAllSubscriptions(params = {}) {
  return client.get('/subscriptions', { params })
}

export async function insertSubscription(data) {
  return client.post('/subscriptions', data)
}

export async function patchSubscription(id, patch) {
  return client.patch(`/subscriptions/${id}`, patch)
}

export async function deleteSubscriptionRecord(id) {
  return client.delete(`/subscriptions/${id}`)
}
