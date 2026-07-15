import client from './axiosClient'

export async function fetchHostReviews(hostId) {
  return client.get(`/reviews/host/${hostId}`)
}

export async function createReview({ groupId, rating, comment }) {
  return client.post('/reviews', { groupId, rating, comment })
}
