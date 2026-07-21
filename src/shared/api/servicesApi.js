import client from './axiosClient'

export async function readAllServices() {
  return client.get('/services')
}
