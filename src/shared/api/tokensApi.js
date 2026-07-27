import client from './axiosClient'

export async function fetchTokenBalance() {
  return client.get('/tokens')
}

export async function fetchGroupTokenTransactions(groupId) {
  return client.get('/tokens', { params: { groupId } })
}

export async function topupTokens(amount) {
  return client.post('/tokens/topup', { amount })
}
