import { getServiceById } from './serviceUtils'

// 探索頁的篩選/排序邏輯
// memberGroupIds：目前使用者已加入的群組 id 集合——群組額滿（full）後正常會從探索頁消失，
// 但已經是該群組成員的人仍應該看得到自己的群組卡片（團主本人在呼叫端已被排除在 groups 之外）
export function applyFilters(groups, { category, service, maxPrice, sortBy, q }, memberGroupIds = new Set()) {
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
    // 額滿群組（openSeats 0，只有自己已加入才會出現在清單裡）排到最後，
    // 不然「剩餘名額由少到多」會把自己那組沒名額的群組排到最上面，看起來像是最推薦的選擇
    case 'seats':     result.sort((a, b) => (a.openSeats || Infinity) - (b.openSeats || Infinity)); break
    default:          result.sort((a, b) => b.hostRating - a.hostRating)
  }

  return result
}
