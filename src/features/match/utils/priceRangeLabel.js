// 每人申請費用篩選條件的顯示文字：兩端都沒設定時回傳 null（代表不限金額）
export function formatPriceRangeLabel(minPrice, maxPrice) {
  if (minPrice == null && maxPrice == null) return null
  if (minPrice != null && maxPrice != null) return `${minPrice} - ${maxPrice}`
  if (maxPrice != null) return `${maxPrice} 以下`
  return `${minPrice} 以上`
}
