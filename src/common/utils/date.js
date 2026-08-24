export function toISODate(dateLike = new Date(), fallback = '') {
  if (!dateLike) return fallback
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike)
  if (Number.isNaN(date.getTime())) return fallback
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function byNewest(a, b) {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
}

export function nowISO() {
  return new Date().toISOString()
}

export function daysUntil(dateLike, baseDate = new Date()) {
  if (!dateLike) return 0
  const target = new Date(dateLike)
  if (Number.isNaN(target.getTime())) return 0

  const base = new Date(baseDate)
  base.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  return Math.ceil((target - base) / 86400000)
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function dateFromBillingDay(year, monthIndex, day) {
  const safeDay = Math.min(day, daysInMonth(year, monthIndex))
  return new Date(year, monthIndex, safeDay)
}

export function computeNextBillingDate(day, baseDate = new Date()) {
  const billingDay = Number.parseInt(day, 10)
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) {
    return ''
  }

  const today = new Date(baseDate)
  today.setHours(0, 0, 0, 0)

  let candidate = dateFromBillingDay(today.getFullYear(), today.getMonth(), billingDay)
  if (candidate <= today) {
    candidate = dateFromBillingDay(today.getFullYear(), today.getMonth() + 1, billingDay)
  }

  return toISODate(candidate)
}

export function advanceByCycle(date, billingCycle) {
  const d = new Date(date)
  if (billingCycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
  else d.setMonth(d.getMonth() + 1)
  return d
}

function extractTime(dateLike) {
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return ''
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function formatDateTime(dateLike) {
  const date = toISODate(dateLike)
  const time = extractTime(dateLike)
  if (!date) return ''
  return time ? `${date} ${time}` : date
}

export function formatRelativeDate(dateLike, baseDate = new Date()) {
  const days = daysUntil(dateLike, baseDate)
  const time = extractTime(dateLike)
  const suffix = time ? ` ${time}` : ''
  if (days === 0) return `今天${suffix}`
  if (days === 1) return '明天'
  if (days > 1) return `${days} 天後`
  if (days === -1) return `昨天${suffix}`
  return `${Math.abs(days)} 天前`
}
