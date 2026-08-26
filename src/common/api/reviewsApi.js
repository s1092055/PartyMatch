import client from './axiosClient'

export async function fetchUserReviews(userId) {
  return client.get(`/reviews/user/${userId}`)
}

export async function createReview({ groupId, revieweeId, rating, comment }) {
  return client.post('/reviews', { groupId, revieweeId, rating, comment })
}
