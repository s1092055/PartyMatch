import { create } from 'zustand'
import { fetchUserReviews, createReview } from '../api/reviewsApi'

export const useReviewStore = create((set, get) => ({
  byUserId: {},

  fetchForUser: async (userId) => {
    if (!userId || get().byUserId[userId]?.loading) return
    set(s => ({ byUserId: { ...s.byUserId, [userId]: { ...(s.byUserId[userId] ?? {}), loading: true } } }))
    try {
      const data = await fetchUserReviews(userId)
      set(s => ({ byUserId: { ...s.byUserId, [userId]: { ...data, loading: false } } }))
    } catch (err) {
      set(s => ({ byUserId: { ...s.byUserId, [userId]: { average: null, count: 0, reviews: [], loading: false, error: err.message } } }))
    }
  },

  getForUser: (userId) => get().byUserId[userId] ?? null,

  submit: async ({ groupId, revieweeId, rating, comment }) => {
    await createReview({ groupId, revieweeId, rating, comment })
    await get().fetchForUser(revieweeId)
  },
}));
