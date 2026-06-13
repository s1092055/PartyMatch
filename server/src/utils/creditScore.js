export async function adjustCreditScore(tx, { userId, delta, reason, groupId, relatedReviewId }) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { creditScore: true } })
  const current = user?.creditScore ?? 0
  const nextScore = Math.max(0, Math.min(100, current + delta))
  const appliedDelta = nextScore - current
  await Promise.all([
    tx.user.update({ where: { id: userId }, data: { creditScore: nextScore } }),
    tx.creditScoreLog.create({ data: { userId, delta: appliedDelta, reason, relatedGroupId: groupId ?? null, relatedReviewId: relatedReviewId ?? null } }),
  ])
}
