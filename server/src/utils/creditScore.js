// 這個檔案跟前端的 src/common/utils/creditScore.js（CREDIT_RULES／顯示格式化）是完全不同的檔案，
// 兩邊沒有 import 關係，只是路徑相似容易搜混——server 端這裡只負責寫入分數異動跟紀錄。
//
// 信用分數必須夾在 [0, 100] 之間（使用者明確要求，正式版不得超過 100 或低於 0），所以不能直接用
// Prisma 的 increment——先讀出目前分數、算出夾住後的新值再整個寫回；紀錄裡的 delta 用「實際套用的
// 增減量」而不是規則原始值，避免分數已經到頂/到底時，紀錄寫著 +5 但畫面上分數其實沒有變化那麼多
export async function adjustCreditScore(tx, { userId, delta, reason, groupId }) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { creditScore: true } })
  const current = user?.creditScore ?? 0
  const nextScore = Math.max(0, Math.min(100, current + delta))
  const appliedDelta = nextScore - current
  await Promise.all([
    tx.user.update({ where: { id: userId }, data: { creditScore: nextScore } }),
    tx.creditScoreLog.create({ data: { userId, delta: appliedDelta, reason, relatedGroupId: groupId ?? null } }),
  ])
}
