import { computeSeatCost } from './pricing.js'
import { notify, notifyBatch } from '../routes/groups/shared.js'

export async function admitMemberIntoGroup(tx, { groupId, userId, seatCost, maxMembers, note }) {
  const applicant = await tx.user.findUnique({ where: { id: userId }, select: { tokenBalance: true } })
  if (!applicant || applicant.tokenBalance < seatCost) {
    const err = new Error('PM幣餘額不足，無法加入')
    err.statusCode = 400
    throw err
  }

  const capacity = await tx.group.updateMany({
    where: { id: groupId, status: 'recruiting', currentMembers: { lt: maxMembers - 1 } },
    data:  { currentMembers: { increment: 1 }, escrowTokens: { increment: seatCost } },
  });
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
    tx.user.update({ where: { id: userId }, data: { tokenBalance: { decrement: seatCost } } }),
  ])
  const currentGroup = await tx.group.findUnique({ where: { id: groupId }, select: { currentCycle: true } })
  await tx.tokenTransaction.create({
    data: { userId, type: 'escrow', amount: -seatCost, relatedGroupId: groupId, cycle: currentGroup?.currentCycle ?? 1, note },
  })

  await advanceToFullIfNeeded(tx, groupId, { triggeringUserId: userId })
  return member
}

export async function finalizeApprovedApplication(tx, { groupId, userId, maxMembers }) {
  const capacity = await tx.group.updateMany({
    where: { id: groupId, status: 'recruiting', currentMembers: { lt: maxMembers - 1 } },
    data:  { currentMembers: { increment: 1 } },
  });
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

  await advanceToFullIfNeeded(tx, groupId, { triggeringUserId: userId })
  return member
}

async function advanceToFullIfNeeded(tx, groupId, { triggeringUserId } = {}) {
  const updatedGroup = await tx.group.findUnique({
    where:  { id: groupId },
    select: { currentMembers: true, maxMembers: true, hostId: true, planName: true, service: { select: { name: true } } },
  });
  if (updatedGroup.currentMembers + 1 >= updatedGroup.maxMembers) {
    await tx.group.update({ where: { id: groupId }, data: { status: 'full' } })
    await rejectPendingApplications(tx, groupId, {
      refundNote: '群組名額已滿，代管退款',
      buildMessage: groupLabel => `很遺憾，「${groupLabel}」群組名額已滿，你的申請未通過，代管費用已退還至你的PM幣餘額，你可以繼續探索其他群組。`,
    })

    const groupLabel = updatedGroup.planName ?? updatedGroup.service?.name ?? ''
    notify({
      userId:  updatedGroup.hostId,
      type:    'group_full',
      title:   '群組名額已滿',
      message: `「${groupLabel}」群組名額已滿，可以點擊鎖定群組了。`,
      meta:    { groupId },
    })

    // 已加入的成員本來完全收不到「群組額滿」這件事的任何通知，只有團主會知道，
    // 導致成員端的群組資料在瀏覽器裡不會被觸發重抓、停留在額滿前的舊狀態，見 docs-private 的相關 bug 紀錄
    const existingMembers = await tx.member.findMany({ where: { groupId }, select: { userId: true } })
    const memberUserIds = existingMembers.map(m => m.userId).filter(id => id !== triggeringUserId)
    if (memberUserIds.length > 0) {
      notifyBatch(memberUserIds.map(userId => ({
        userId,
        type:    'group_full_member',
        title:   '群組名額已滿',
        message: `「${groupLabel}」群組名額已滿，等待團主鎖定群組即可開始服務。`,
        meta:    { groupId },
      })))
    }
  }
}

export async function rejectPendingApplications(tx, groupId, { refundNote, buildMessage }) {
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
    await refundEscrow(tx, { userId: app.userId, groupId, amount: refundAmount, note: refundNote })
  }

  notifyBatch(pendingApps.map(app => ({
    userId:  app.userId,
    type:    'application_rejected',
    title:   '申請未通過',
    message: buildMessage(groupLabel),
    meta:    { groupId, applicationId: app.id },
  })))
}

export async function refundEscrow(tx, { userId, groupId, amount, note }) {
  if (amount <= 0) return
  const [, group] = await Promise.all([
    tx.user.update({ where: { id: userId }, data: { tokenBalance: { increment: amount } } }),
    tx.group.update({ where: { id: groupId }, data: { escrowTokens: { decrement: amount } } }),
  ])
  await tx.tokenTransaction.create({
    data: { userId, type: 'refund', amount, relatedGroupId: groupId, cycle: group.currentCycle, note },
  })
}
