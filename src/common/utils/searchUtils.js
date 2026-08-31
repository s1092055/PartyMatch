import { getServiceById } from './serviceUtils'

export function applyFilters(groups, { category }) {
  let result = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0)

  if (category !== 'all') result = result.filter(g => getServiceById(g.serviceId)?.category === category)

  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
