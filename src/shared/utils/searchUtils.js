import { getServiceById } from './serviceUtils'

const SEARCH_STORAGE_KEY = 'pm_recent_searches'
const MAX_RECENT = 8

export function loadRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveRecentSearches(list) {
  localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(list))
}

export function addRecentSearch(term) {
  const trimmed = term.trim()
  if (!trimmed) return
  const list = loadRecentSearches().filter(s => s !== trimmed)
  saveRecentSearches([trimmed, ...list].slice(0, MAX_RECENT))
}

export function removeRecentSearch(term) {
  saveRecentSearches(loadRecentSearches().filter(s => s !== term))
}

// 探索頁與搜尋 modal 共用的篩選/排序邏輯，各自獨立套用、互不影響對方的顯示結果
export function applyFilters(groups, { keyword, category, service, maxPrice, sortBy }) {
  let result = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0)

  if (keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    result = result.filter(g =>
      g.serviceName.toLowerCase().includes(kw) ||
      g.planName.toLowerCase().includes(kw) ||
      g.hostName.toLowerCase().includes(kw) ||
      g.tags.some(t => t.toLowerCase().includes(kw))
    )
  }

  if (category !== 'all' && service === 'all') result = result.filter(g => getServiceById(g.serviceId)?.category === category)
  if (service !== 'all') result = result.filter(g => g.serviceId === service)
  if (maxPrice !== 'any') result = result.filter(g => g.pricePerSeat <= Number(maxPrice))

  switch (sortBy) {
    case 'rating':    result.sort((a, b) => b.hostRating - a.hostRating); break
    case 'price_asc': result.sort((a, b) => a.pricePerSeat - b.pricePerSeat); break
    case 'seats':     result.sort((a, b) => a.openSeats - b.openSeats); break
    default:          result.sort((a, b) => b.hostRating - a.hostRating)
  }

  return result
}
