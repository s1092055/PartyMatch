import { computeSeatCost } from './pricing.js'
import { notify } from '../routes/groups/shared.js'

// 團主手動加入成員（members.js 的 POST /）：沒有經過「申請」這一步，名額檢查、代管扣款、
// 建立成員/訂閱、額滿自動推進 full 要一次做完，跟申請接受共用同一套名額邏輯，避免繞過上限。
export async function admitMemberIntoGroup(tx, { groupId, userId, seatCost, maxMembers, note }) {
  const applicant = await tx.user.findUnique({ where: { id: userId }, select: { tokenBalance: true } })
  if (!applicant || applicant.tokenBalance < seatCost) {
    const err = new Error('PM幣餘額不足，無法加入')
    err.statusCode = 400
    throw err
  }

  // 條件式更新：status/currentMembers 在寫入當下重新核對，避免併發加入導致超額或加入到已非招募中的群組
  // currentMembers 只計非團主成員，maxMembers 是含團主的總名額，所以名額上限要扣掉團主佔的 1 個
  const capacity = await tx.group.updateMany({
    where: { id: groupId, status: 'recruiting', currentMembers: { lt: maxMembers - 1 } },
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

  await advanceToFullIfNeeded(tx, groupId)
  return member
}

// 申請接受（applications.js 的 PATCH /:id）：代管扣款已經在使用者送出申請的當下完成過了，
// 這裡只需要核對名額、建立成員/訂閱、額滿自動推進 full，不會再扣一次款。
export async function finalizeApprovedApplication(tx, { groupId, userId, maxMembers }) {
  // 同上：maxMembers 含團主，名額上限要扣掉團主佔的 1 個
  const capacity = await tx.group.updateMany({
    where: { id: groupId, status: 'recruiting', currentMembers: { lt: maxMembers - 1 } },
    data:  { currentMembers: { increment: 1 } },
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
  ])

  await advanceToFullIfNeeded(tx, groupId)
  return member
}

async function advanceToFullIfNeeded(tx, groupId) {
  // 加入後自動檢查是否額滿，若滿則推進到 full；currentMembers 只計非團主成員，
  // +1 是團主自己佔的名額，跟前端 normalizeGroup() 的 usedSeats = memberCount + 1 對齊
  const updatedGroup = await tx.group.findUnique({
    where:  { id: groupId },
    select: { currentMembers: true, maxMembers: true, hostId: true, planName: true, service: { select: { name: true } } },
  })
  if (updatedGroup.currentMembers + 1 >= updatedGroup.maxMembers) {
    await tx.group.update({ where: { id: groupId }, data: { status: 'full' } })
    await autoRejectPendingApplications(tx, groupId)

    const groupLabel = updatedGroup.planName ?? updatedGroup.service?.name ?? ''
    notify({
      userId:  updatedGroup.hostId,
      type:    'group_full',
      title:   '群組名額已滿',
      message: `「${groupLabel}」群組名額已滿，可以點擊鎖定群組了。`,
      meta:    { groupId },
    })
  }
}

// 群組額滿當下，同一群組其他還在審核中的申請已經不可能再有名額，批次轉為未通過、退還各自
// 代管的 PM 幣，並各自發通知，不用讓申請人卡在 pending 狀態、等團主之後才想到要手動一一拒絕
async function autoRejectPendingApplications(tx, groupId) {
  const pendingApps = await tx.application.findMany({
    where:   { groupId, status: 'pending' },
    include: { group: { select: { monthlyFee: true, billingCycle: true, planName: true, escrowTokens: true, service: { select: { name: true } } } } },
  })
  if (pendingApps.length === 0) return

  const groupLabel = pendingApps[0].group.planName ?? pendingApps[0].group.service?.name ?? ''
  let remainingEscrow = pendingApps[0].group.escrowTokens

  for (const app of pendingApps) {
    const escrowAmount = app.escrowAmount ?? computeSeatCost(app.group)
    const refundAmount = Math.min(escrowAmount, remainingEscrow)
    remainingEscrow -= refundAmount

    await tx.application.update({ where: { id: app.id }, data: { status: 'rejected', activeKey: null } })
    await refundEscrow(tx, { userId: app.userId, groupId, amount: refundAmount, note: '群組名額已滿，代管退款' })

    notify({
      userId:  app.userId,
      type:    'application_rejected',
      title:   '申請未通過',
      message: `很遺憾，「${groupLabel}」群組名額已滿，你的申請未通過，代管費用已退還至你的PM幣餘額，你可以繼續探索其他群組。`,
      meta:    { groupId, applicationId: app.id },
    })
  }
}

// 退還代管金額共用邏輯：申請被拒絕、申請人取消、成員被移除或自行退出時都要走這裡，
// 避免三處各自重寫一次「退款、扣代管、寫交易紀錄」。amount 由呼叫端先算好（用
// Math.min(實際扣過的金額, 目前 escrowTokens) 夾住），這裡不重新計算金額。
export async function refundEscrow(tx, { userId, groupId, amount, note }) {
  if (amount <= 0) return
  await Promise.all([
    tx.user.update({ where: { id: userId }, data: { tokenBalance: { increment: amount } } }),
    tx.group.update({ where: { id: groupId }, data: { escrowTokens: { decrement: amount } } }),
    tx.tokenTransaction.create({
      data: { userId, type: 'refund', amount, relatedGroupId: groupId, note },
    }),
  ])
}
