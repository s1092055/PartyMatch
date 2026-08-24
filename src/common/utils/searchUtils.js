import { getServiceById } from './serviceUtils'

export function applyFilters(
  groups,
  { category, service, maxPrice, sortBy, q },
  memberGroupIds = new Set()
) {
  let result = groups.filter(g =>
    (g.status === 'recruiting' && g.openSeats > 0) || (g.status === 'full' && memberGroupIds.has(g.id))
  )

  if (category !== 'all' && service === 'all') result = result.filter(g => getServiceById(g.serviceId)?.category === category)
  if (service !== 'all') result = result.filter(g => g.serviceId === service)
  if (maxPrice !== 'any') result = result.filter(g => g.pricePerSeat <= Number(maxPrice))
  if (q?.trim()) {
    const keyword = q.trim().toLowerCase()
    result = result.filter(g => {
      const serviceName = getServiceById(g.serviceId)?.name ?? g.serviceName ?? ''
      return serviceName.toLowerCase().includes(keyword) || (g.planName ?? '').toLowerCase().includes(keyword)
    })
  }

  switch (sortBy) {
    case 'rating':    result.sort((a, b) => b.hostRating - a.hostRating); break
    case 'price_asc': result.sort((a, b) => a.pricePerSeat - b.pricePerSeat); break
    case 'seats':
      result.sort((a, b) => (a.openSeats || Infinity) - (b.openSeats || Infinity));break
    default:          result.sort((a, b) => b.hostRating - a.hostRating)
  }

  return result
}
