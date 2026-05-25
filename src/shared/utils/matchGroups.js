import { daysUntil } from './date'

function calcScore(group, conditions) {
  let score = 0
  if (group.isHostVerified) score += 2
  if (group.hostRating >= 4.8) score += 2
  else if (group.hostRating >= 4.5) score += 1
  if (group.openSeats >= 3) score += 1
  const daysUntilBilling = daysUntil(group.nextBillingDate)
  if (daysUntilBilling > 20) score += 1
  if (conditions.maxPrice && group.pricePerSeat < conditions.maxPrice * 0.75) score += 1
  return score
}

function buildReasons(group, conditions) {
  const reasons = []
  if (group.isHostVerified)
    reasons.push('已驗證團主，信任度高')
  if (group.hostRating >= 4.8)
    reasons.push(`評分 ${group.hostRating}，口碑極佳`)
  else if (group.hostRating >= 4.5)
    reasons.push(`評分 ${group.hostRating}，評價良好`)
  if (group.openSeats >= 3)
    reasons.push(`名額充裕，還剩 ${group.openSeats} 個`)
  if (conditions.maxPrice && group.pricePerSeat <= conditions.maxPrice * 0.8)
    reasons.push(`NT$${group.pricePerSeat}，低於預算 ${Math.round((1 - group.pricePerSeat / conditions.maxPrice) * 100)}%`)
  return reasons.slice(0, 3)
}

function getBillingDay(dateStr) {
  return new Date(dateStr).getDate()
}

function getAgeMonths(createdAt) {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
}

export function matchGroups(groups, conditions) {
  const { services = [], maxPrice, joinMode, minRating, billingPeriod, groupAge } = conditions

  const filtered = groups.filter(g => {
    if (g.status !== 'recruiting') return false
    if (g.openSeats <= 0) return false
    if (services.length > 0 && !services.includes(g.serviceId)) return false
    if (maxPrice && g.pricePerSeat > maxPrice) return false
    if (joinMode && joinMode !== 'any' && g.joinMode !== joinMode) return false
    if (minRating && g.hostRating < minRating) return false

    if (billingPeriod && billingPeriod !== 'any') {
      const day = getBillingDay(g.nextBillingDate)
      if (billingPeriod === 'early' && day > 10) return false
      if (billingPeriod === 'mid' && (day < 11 || day > 20)) return false
      if (billingPeriod === 'late' && day < 21) return false
    }

    if (groupAge && groupAge !== 'any') {
      const months = getAgeMonths(g.createdAt)
      if (groupAge === 'new' && months > 3) return false
      if (groupAge === 'established' && (months < 3 || months > 12)) return false
      if (groupAge === 'veteran' && months < 12) return false
    }

    return true
  })

  return filtered
    .map(g => ({ ...g, _score: calcScore(g, conditions), _reasons: buildReasons(g, conditions) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
}
