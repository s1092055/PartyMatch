import { create } from 'zustand'
import { fetchHostReviews, createReview } from '../api/reviewsApi'

export const useReviewStore = create((set, get) => ({
  byHostId: {},

  fetchForHost: async (hostId) => {
    if (!hostId || get().byHostId[hostId]?.loading) return
    set(s => ({ byHostId: { ...s.byHostId, [hostId]: { ...(s.byHostId[hostId] ?? {}), loading: true } } }))
    try {
      const data = await fetchHostReviews(hostId)
      set(s => ({ byHostId: { ...s.byHostId, [hostId]: { ...data, loading: false } } }))
    } catch (err) {
      set(s => ({ byHostId: { ...s.byHostId, [hostId]: { average: null, count: 0, reviews: [], loading: false, error: err.message } } }))
    }
  },

  getForHost: (hostId) => get().byHostId[hostId] ?? null,

  submit: async ({ groupId, hostId, rating, comment }) => {
    await createReview({ groupId, rating, comment })
    await get().fetchForHost(hostId)
  },
}));
