export const PRICE_MIN = 0;
export const DEFAULT_PRICE_MAX = 1000
export const PRICE_MAX_CAP = 100000

export function parsePriceValue(raw) {
  if (!raw) return { kind: 'empty' }
  const num = Number(raw)
  if (!Number.isFinite(num)) return { kind: 'invalid' }
  return { kind: 'value', value: Math.round(num) }
}

export function clampPrice(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function nearestRatingMark(minRating, marks) {
  if (minRating <= 0) return null
  return marks.reduce((closest, mark) => (mark <= minRating ? mark : closest), null)
}
