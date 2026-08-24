import { PRICE_MIN } from './priceRangeDefaults'

export function formatPriceRangeLabel(minPrice, maxPrice) {
  const hasMin = minPrice != null && minPrice > PRICE_MIN
  if (!hasMin && maxPrice == null) return null
  if (hasMin && maxPrice != null) return `${minPrice} - ${maxPrice}`
  if (maxPrice != null) return `${maxPrice} 以下`
  return `${minPrice} 以上`
}
