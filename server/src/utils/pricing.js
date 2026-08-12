import { decryptCredential } from '../lib/credentialEncryption.js'

// 席位費用（yearly = monthlyFee * 12），套用/續訂/移除成員時的退補款計算共用同一份邏輯
export function computeSeatCost(group) {
  // monthlyFee 是 Prisma Decimal 型別，讀出來是 Decimal.js 物件不是普通 number，
  // 算術運算前要先明確轉成 Number（金額範圍小，轉換不會有精度損失疑慮）
  const monthlyFee = Number(group.monthlyFee)
  return group.billingCycle === 'yearly'
    ? Math.round(monthlyFee * 12)
    : Math.round(monthlyFee)
}

// Prisma Decimal 欄位序列化成 JSON 回應會變成字串，回傳給前端前統一轉回 number，
// 前端才能維持原本直接把 monthlyFee 當數字做運算/顯示的寫法，不用另外改；
// sharedCredentials 在資料庫內是加密過的密文（見 credentialEncryption.js），這裡一併解密回明文——
// 這是 groups/crud.js、groups/lifecycle.js 幾乎所有 group 回應共用的序列化點，之後不論哪個 route
// 回傳 group 都不用各自記得解密。groups/crud.js 的 GET 系列會在這之後才套用
// maskGroupDetailSensitiveFields／maskGroupListSensitiveFields 依角色決定要不要真的送出這個欄位，
// 這裡多解密出來的值對非參與者一律會被蓋成 undefined，不會外洩
export function toPlainGroup(group) {
  if (!group || group.monthlyFee == null) return group
  const plain = { ...group, monthlyFee: Number(group.monthlyFee) }
  if (typeof plain.sharedCredentials === 'string' && plain.sharedCredentials) {
    plain.sharedCredentials = decryptCredential(plain.sharedCredentials)
  }
  return plain
}
