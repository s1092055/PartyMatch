import prisma from '../lib/prisma.js'
import { computeSeatCost } from '../utils/pricing.js'
import { refundEscrow } from '../utils/membership.js'
import { notify, claimGroupStatus } from '../routes/groups/shared.js'

function httpError(statusCode, message) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

export async function removeMember({ memberId, actorId }) {
  const existing = await prisma.member.findUnique({
    where:   { id: memberId },
    include: {
      group: { select: { id: true, hostId: true, planName: true, status: true, monthlyFee: true, billingCycle: true, escrowTokens: true, currentMembers: true, service: { select: { name: true } } } },
      user:  { select: { name: true } },
    },
  })
  if (!existing) throw httpError(404, '成員不存在')

  const isHost = existing.group.hostId === actorId
  const isSelf = existing.userId === actorId
  if (!isHost && !isSelf) throw httpError(403, '無操作權限')

  if (!['recruiting', 'full'].includes(existing.group.status)) {
    throw httpError(400, '群組啟用後無法變更成員名單')
  }

  const seatCost = computeSeatCost(existing.group)
  const refundAmount = Math.min(seatCost, existing.group.escrowTokens)
  const newCount = existing.group.currentMembers - 1

  await prisma.$transaction(async (tx) => {
    await claimGroupStatus(tx, existing.groupId, {
      fromStatus: ['recruiting', 'full'],
      data:       { currentMembers: { decrement: 1 } },
      message:    '群組已被鎖定，無法變更成員名單，請重新整理頁面',
    })
    await tx.member.delete({ where: { id: memberId } })
    await tx.group.updateMany({
      where: { id: existing.groupId, status: 'full' },
      data:  { status: 'recruiting' },
    })
    await refundEscrow(tx, {
      userId:  existing.userId,
      groupId: existing.groupId,
      amount:  refundAmount,
      note:    isHost ? '被團主移除，代管退款' : '自行退出，代管退款',
    })
    await tx.application.updateMany({
      where: { groupId: existing.groupId, userId: existing.userId, status: 'approved' },
      data:  { status: isHost ? 'removed' : 'left', activeKey: null },
    })
  })

  const groupLabel = existing.group.planName ?? existing.group.service?.name ?? ''
  if (isSelf) {
    notify({
      userId:  existing.group.hostId,
      type:    'member_left',
      title:   '成員已退出群組',
      message: `${existing.user?.name ?? '成員'} 已退出「${groupLabel}」群組。`,
      meta:    { groupId: existing.groupId },
    })
  } else {
    notify({
      userId:  existing.userId,
      type:    'member_removed',
      title:   '已被移出群組',
      message: `團主已將你移出「${groupLabel}」群組，代管費用已退還至你的PM幣餘額。`,
      meta:    { groupId: existing.groupId },
    })
  }

  return { currentMembers: newCount }
}
