import client from './axiosClient'

export async function readAllPaymentRecords(params = {}) {
  return client.get('/payments', { params })
}

export async function insertPaymentRecord(data) {
  return client.post('/payments', data)
}
