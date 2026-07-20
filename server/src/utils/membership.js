// 把使用者加入群組共用的交易邏輯：申請核准（applications.js）與團主手動加入成員（members.js）
// 都要做一樣的事——餘額檢查、併發安全的名額檢查、建立成員/訂閱、代管扣款、額滿自動推進 full。
// 抽成同一個函式，避免兩處各自實作、未來規則變動時只改到其中一處。
export async function admitMemberIntoGroup(tx, { groupId, userId, seatCost, maxMembers, note }) {
  const applicant = await tx.user.findUnique({ where: { id: userId }, select: { tokenBalance: true } })
  if (!applicant || applicant.tokenBalance < seatCost) {
    const err = new Error('PM幣餘額不足，無法加入')
    err.statusCode = 400
    throw err
  }

  // 條件式更新：status/currentMembers 在寫入當下重新核對，避免併發加入導致超額或加入到已非招募中的群組
  const capacity = await tx.group.updateMany({
    where: { id: groupId, status: 'recruiting', currentMembers: { lt: maxMembers } },
    data:  { currentMembers: { increment: 1 }, escrowTokens: { increment: seatCost } },
  })
  if (capacity.count === 0) {
    const err = new Error('群組名額已滿或已結束招募，無法加入')
    err.statusCode = 409
    throw err
  }

  const [member] = await Promise.all([
    tx.member.upsert({
      where:  { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    }),
    tx.subscription.upsert({
      where:  { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    }),
    // 代管：扣除使用者PM幣
    tx.user.update({ where: { id: userId }, data: { tokenBalance: { decrement: seatCost } } }),
    // 寫入PM幣交易紀錄
    tx.tokenTransaction.create({
      data: { userId, type: 'escrow', amount: -seatCost, relatedGroupId: groupId, note },
    }),
  ])

  // 加入後自動檢查是否額滿，若滿則推進到 full
  const updatedGroup = await tx.group.findUnique({ where: { id: groupId }, select: { currentMembers: true, maxMembers: true } })
  if (updatedGroup.currentMembers >= updatedGroup.maxMembers) {
    await tx.group.update({ where: { id: groupId }, data: { status: 'full' } })
  }

  return member
}
