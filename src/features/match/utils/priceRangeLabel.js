import { PRICE_MIN } from './priceRangeDefaults'

// 每人申請費用篩選條件的顯示文字：兩端都沒設定時回傳 null（代表不限金額）；
// minPrice 等於最低值（0）時視同沒有下限，不然預設狀態會顯示成「0 - 1000」這種
// 看起來像刻意設定過區間的文字，其實 0 只是「沒有下限」的意思
export function formatPriceRangeLabel(minPrice, maxPrice) {
  const hasMin = minPrice != null && minPrice > PRICE_MIN
  if (!hasMin && maxPrice == null) return null
  if (hasMin && maxPrice != null) return `${minPrice} - ${maxPrice}`
  if (maxPrice != null) return `${maxPrice} 以下`
  return `${minPrice} 以上`
}
