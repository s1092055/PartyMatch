import client from './axiosClient'

export async function readAllServices() {
  return client.get('/services')
}

export async function readServiceById(id) {
  return client.get(`/services/${id}`)
}
