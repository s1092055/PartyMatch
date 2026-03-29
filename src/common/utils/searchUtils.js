import { getServiceById } from './serviceUtils'
import { byNewest } from './date'

export function applyFilters(groups, { category }) {
  let result = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0)

  if (category !== 'all') result = result.filter(g => getServiceById(g.serviceId)?.category === category)

  return result.sort(byNewest)
}
