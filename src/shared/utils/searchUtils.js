import { getGroups } from '../stores/groupStore'
import { getCurrentUser } from '../stores/authStore'

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

export function searchGroups(query) {
  if (!query.trim()) return []
  const q = query.trim().toLowerCase()
  const activeUserId = getCurrentUser()?.id
  return getGroups()
    .filter(g => g.status === 'recruiting' && g.hostId !== activeUserId)
    .filter(g =>
      g.serviceName?.toLowerCase().includes(q) ||
      g.planName?.toLowerCase().includes(q) ||
      g.hostName?.toLowerCase().includes(q) ||
      g.groupName?.toLowerCase().includes(q) ||
      g.tags?.some(t => t.toLowerCase().includes(q))
    )
    .slice(0, 12)
}
