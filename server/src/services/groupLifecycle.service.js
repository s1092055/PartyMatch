import prisma from '../lib/prisma.js'
import { computeSeatCost } from '../utils/pricing.js'
import { notify, notifyGroupConversation, claimGroupStatus } from '../routes/groups/shared.js'
import { rejectPendingApplications } from '../utils/membership.js'
import { adjustCreditScore } from '../utils/creditScore.js'
import { encryptCredential } from '../lib/credentialEncryption.js'

const HOST_GROUP_INCLUDE = {
  host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
  service: true,
  _count:  { select: { members: true } },
};

const MAX_BILLING_DATE_ADJUST_DAYS = 7

function httpError(statusCode, message, extra) {
  const err = new Error(message)
  err.statusCode = statusCode
  if (extra) Object.assign(err, extra)
  return err
}

export async function activateGroup({ groupId, hostId }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, service: true },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'pending_activation') throw httpError(400, `群組狀態為 ${group.status}，無法啟用（需為 pending_activation）`)

  const confirmDeadline = new Date()
  confirmDeadline.setHours(confirmDeadline.getHours() + 48)

  const isFirstActivation = !group.hasActivatedOnce;
  const nextBillingDate = isFirstActivation ? new Date() : group.nextBillingDate
  if (isFirstActivation) {
    if (group.billingCycle === 'yearly') nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedGroup = await tx.group.update({
      where: { id: groupId },
      data: {
        status: 'confirming',
        confirmDeadline,
        hasActivatedOnce: true,
        ...(isFirstActivation && { nextBillingDate }),
      },
      include: HOST_GROUP_INCLUDE,
    })
    if (isFirstActivation) {
      await tx.subscription.updateMany({
        where: { groupId },
        data:  { nextBillingDate },
      })
    }
    await adjustCreditScore(tx, { userId: group.hostId, delta: 5, reason: '團主成功啟用群組', groupId });
    return updatedGroup
  });

  if (isFirstActivation) {
    const groupLabel = group.planName ?? group.service?.name ?? ''
    const finalDateText = nextBillingDate.toISOString().slice(0, 10).replace(/-/g, '/')
    ;[group.hostId, ...group.members.map(m => m.userId)].forEach(userId => {
      notify({
        userId,
        type:    'billing_date_confirmed',
        title:   '下次扣款日已確定',
        message: `「${groupLabel}」服務已啟用，下次扣款日確定為 ${finalDateText}。`,
        meta:    { groupId, nextBillingDate: nextBillingDate.toISOString(), estimated: false },
      })
    })
  }

  const groupLabelForActivation = group.planName ?? group.service?.name ?? ''
  notify({
    userId:  group.hostId,
    type:    'group_activated',
    title:   '服務已啟用，確認期開始',
    message: `「${groupLabelForActivation}」群組服務已啟用，成員有 48 小時確認期。`,
    meta:    { groupId },
  })
  group.members.forEach(m => {
    notify({
      userId:  m.userId,
      type:    'group_activated',
      title:   '服務已啟用，請確認',
      message: `「${groupLabelForActivation}」服務已啟用！請在 48 小時內確認服務是否正常，否則將自動完成。`,
      meta:    { groupId },
    })
  })

  return updated
}

export async function adjustBillingDate({ groupId, hostId, nextBillingDate: requestedRaw, note: noteRaw }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, service: true },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'confirming') throw httpError(400, `群組狀態為 ${group.status}，只能在確認期調整扣款日`)
  if (group.billingDateAdjustedAt) throw httpError(400, '本期已經調整過扣款日，每期僅能調整一次')
  if (!group.nextBillingDate) throw httpError(400, '這個群組目前沒有扣款日可以調整')

  const requested = new Date(requestedRaw)
  if (Number.isNaN(requested.getTime())) throw httpError(400, '日期格式不正確')

  const current = new Date(group.nextBillingDate);
  const maxAllowed = new Date(current)
  maxAllowed.setDate(maxAllowed.getDate() + MAX_BILLING_DATE_ADJUST_DAYS)
  if (requested <= current) throw httpError(400, '新的扣款日只能比原本的日期晚')
  if (requested > maxAllowed) throw httpError(400, `最多只能延後 ${MAX_BILLING_DATE_ADJUST_DAYS} 天`)

  const note = noteRaw.trim()

  const [updated] = await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: {
        nextBillingDate:           requested,
        billingDateAdjustedAt:     new Date(),
        billingDateAdjustmentNote: note,
      },
      include: HOST_GROUP_INCLUDE,
    }),
    prisma.subscription.updateMany({
      where: { groupId },
      data:  { nextBillingDate: requested },
    }),
  ])

  const groupLabel = group.planName ?? group.service?.name ?? '';
  const oldDateText = current.toISOString().slice(0, 10).replace(/-/g, '/')
  const newDateText = requested.toISOString().slice(0, 10).replace(/-/g, '/')
  group.members.forEach(m => {
    notify({
      userId:  m.userId,
      type:    'billing_date_adjusted',
      title:   '下次扣款日已調整',
      message: `「${groupLabel}」的下次扣款日由 ${oldDateText} 調整為 ${newDateText}，原因：${note}`,
      meta:    { groupId, oldDate: current.toISOString(), nextBillingDate: requested.toISOString(), note },
    })
  })

  return updated
}

export async function confirmService({ groupId, userId }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      host:    { select: { id: true } },
      service: { select: { name: true } },
    },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.status !== 'confirming') throw httpError(400, `群組狀態為 ${group.status}，不在確認期`)

  const member = group.members.find(m => m.userId === userId)
  if (!member) throw httpError(403, '你不是此群組成員')

  const now = new Date()
  const groupLabel = group.planName ?? group.service?.name ?? ''

  await prisma.$transaction(async (tx) => {
    await tx.member.update({ where: { id: member.id }, data: { confirmedAt: now } })
    await adjustCreditScore(tx, { userId: member.userId, delta: 2, reason: '付款被團主確認', groupId })
  });

  notify({
    userId:  group.hostId,
    type:    'member_confirmed_service',
    title:   '成員已確認服務正常',
    message: `${member.user.name} 已確認「${groupLabel}」服務正常。`,
    meta:    { groupId },
  });

  const updatedMembers = await prisma.member.findMany({ where: { groupId } });
  const allConfirmed   = updatedMembers.every(m => m.id === member.id ? true : m.confirmedAt != null)
  const deadlinePassed = group.confirmDeadline && new Date(group.confirmDeadline) <= now

  if (!allConfirmed && !deadlinePassed) return { group: null, released: false }

  const released = await prisma.$transaction(async (tx) => {
    const claimed = await tx.group.updateMany({
      where: { id: groupId, status: 'confirming' },
      data:  { status: 'active', confirmDeadline: null, escrowTokens: 0 },
    })
    if (claimed.count === 0)
      return null;

    await tx.user.update({
      where: { id: group.host.id },
      data:  { tokenBalance: { increment: group.escrowTokens } },
    });
    await tx.tokenTransaction.create({
      data: {
        userId:        group.host.id,
        type:          'release',
        amount:        group.escrowTokens,
        relatedGroupId: groupId,
        note:          '確認期結束，代管款項撥付',
      },
    })
    await tx.subscription.updateMany({
      where: { groupId },
      data:  { status: 'active' },
    })

    return tx.group.findUnique({ where: { id: groupId }, include: HOST_GROUP_INCLUDE })
  });

  if (released) {
    prisma.notification.create({
      data: {
        userId:  group.host.id,
        type:    'escrow_released',
        title:   '代管款項已撥款',
        message: `「${groupLabel}」群組確認期結束，代管款項已撥入你的PM幣餘額。`,
        meta:    { groupId },
      },
    }).catch(console.error)
    notifyGroupConversation(groupId, member.userId, `確認期結束，代管款項已撥款給團主。`).catch(console.error)
  }

  const finalGroup = released ?? (await prisma.group.findUnique({ where: { id: groupId }, include: HOST_GROUP_INCLUDE }));
  return { group: { ...finalGroup, escrowTokens: 0 }, released: true }
}

export async function raiseDispute({ groupId, userId, reason, evidenceUrl }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      service: { select: { name: true } },
    },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.status !== 'confirming') throw httpError(400, `群組狀態為 ${group.status}，不在確認期`)

  const member = group.members.find(m => m.userId === userId)
  if (!member) throw httpError(403, '你不是此群組成員')

  const disputeDeadline = new Date();
  disputeDeadline.setHours(disputeDeadline.getHours() + 48)
  const groupLabel = group.planName ?? group.service?.name ?? ''
  const trimmedReason = reason.trim()

  const updated = await prisma.$transaction(async (tx) => {
    await claimGroupStatus(tx, groupId, {
      fromStatus: 'confirming',
      data:       { status: 'disputed', disputeDeadline },
    });

    await tx.member.update({
      where: { id: member.id },
      data:  {
        serviceInfoIssueNote: trimmedReason,
        ...(evidenceUrl ? { disputeEvidenceUrl: evidenceUrl } : {}),
      },
    })

    await tx.dispute.create({
      data: {
        groupId,
        memberId:             member.id,
        raisedByUserId:       userId,
        hostId:               group.hostId,
        planNameSnapshot:     groupLabel,
        reason:               trimmedReason,
        evidenceUrl:          evidenceUrl ?? null,
        seatCostSnapshot:     computeSeatCost(group),
        escrowTokensSnapshot: group.escrowTokens,
        deadline:             disputeDeadline,
      },
    })

    return tx.group.findUnique({ where: { id: groupId }, include: HOST_GROUP_INCLUDE })
  })

  prisma.notification.create({
    data: {
      userId:  group.hostId,
      type:    'dispute_raised',
      title:   '收到成員問題回報',
      message: `${member.user.name} 針對「${groupLabel}」服務回報問題，將於 48 小時內處理完成。`,
      meta:    { groupId },
    },
  }).catch(console.error)
  notifyGroupConversation(groupId, member.userId, `${member.user.name} 回報了服務問題，等待處理。`).catch(console.error)

  prisma.credentialComment.create({
    data: {
      groupId,
      authorId: member.userId,
      content:  `已提出問題回報：${reason.trim()}`.slice(0, 500),
    },
  }).catch(console.error);

  return updated
}

export async function resolveDisputeByHost({ groupId, hostId, note }) {
  const group = await prisma.group.findUnique({
    where:   { id: groupId },
    include: { members: { include: { user: { select: { id: true, name: true } } } }, service: { select: { name: true } } },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'disputed') throw httpError(400, `群組狀態為 ${group.status}，不在申訴期`)

  const disputeMember = group.members.find(m => m.serviceInfoIssueNote)
  if (!disputeMember) throw httpError(400, '找不到申訴成員')

  const dispute = await prisma.dispute.findFirst({ where: { groupId, status: 'pending' } })
  if (!dispute) throw httpError(400, '找不到進行中的申訴')

  const confirmDeadline = new Date();
  confirmDeadline.setHours(confirmDeadline.getHours() + 48)
  const groupLabel = group.planName ?? group.service?.name ?? ''

  const updated = await prisma.$transaction(async (tx) => {
    await claimGroupStatus(tx, groupId, {
      fromStatus: 'disputed',
      data:       { status: 'confirming', disputeDeadline: null, confirmDeadline },
      message:    '這筆申訴剛好已經被處理過了，請重新整理頁面',
    });

    await tx.member.update({
      where: { id: disputeMember.id },
      data:  { serviceInfoIssueNote: null, disputeEvidenceUrl: null, confirmedAt: null },
    })

    await tx.dispute.update({
      where: { id: dispute.id },
      data:  {
        status:           'resolved_by_host',
        resolutionType:   'host_private_resolved',
        resolvedByHostAt: new Date(),
        resolutionNote:   note ?? null,
        resolvedAt:       new Date(),
      },
    })

    return tx.group.findUnique({ where: { id: groupId }, include: HOST_GROUP_INCLUDE })
  })

  notify({
    userId:  disputeMember.userId,
    type:    'dispute_resolved_by_host',
    title:   '問題已處理完成',
    message: `團主已回覆「${groupLabel}」你回報的問題並處理完成，請重新確認服務是否正常。`,
    meta:    { groupId },
  });

  prisma.credentialComment.create({
    data: {
      groupId,
      authorId: hostId,
      content:  (note ? `問題已處理完成：${note}` : '問題已處理完成').slice(0, 500),
    },
  }).catch(console.error)

  return updated
}

export async function cancelGroup({ groupId, hostId }) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { service: { select: { name: true } } } })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可解散群組')

  const cancellable = ['recruiting', 'full']
  if (!cancellable.includes(group.status)) throw httpError(400, `群組已鎖定（狀態為 ${group.status}），無法解散`)

  const seatCost = computeSeatCost(group)
  const groupLabelForCancel = group.planName ?? group.service?.name ?? ''

  const currentMembers = await prisma.$transaction(async (tx) => {
    const updated = await tx.group.updateMany({
      where: { id: groupId, status: { in: cancellable } },
      data:  { status: 'cancelled' },
    });
    if (updated.count === 0) throw httpError(409, '群組狀態已變動，請重新整理頁面')

    const currentMembers = await tx.member.findMany({ where: { groupId } });
    if (currentMembers.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: currentMembers.map(m => m.userId) } },
        data:  { tokenBalance: { increment: seatCost } },
      });
      await tx.tokenTransaction.createMany({
        data: currentMembers.map(m => ({
          userId:        m.userId,
          type:          'refund',
          amount:        seatCost,
          relatedGroupId: groupId,
          note:          '群組解散，代管退款',
        })),
      })
    }

    await rejectPendingApplications(tx, groupId, {
      refundNote:   '群組已解散，代管退款',
      buildMessage: groupLabel => `很遺憾，「${groupLabel}」群組已被團主解散，你的申請未通過，代管費用已退還至你的PM幣餘額。`,
    });

    await tx.group.update({ where: { id: groupId }, data: { escrowTokens: 0 } })

    return currentMembers
  })

  currentMembers.forEach(m => {
    notify({
      userId:  m.userId,
      type:    'group_cancelled',
      title:   '群組已解散',
      message: `「${groupLabelForCancel}」群組已被團主解散，代管費用已退還至你的PM幣餘額。`,
      meta:    { groupId },
    })
  })

  return { status: 'cancelled' }
}

export async function lockGroup({ groupId, hostId, sharedCredentials: sharedCredentialsRaw }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, service: true },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'full') throw httpError(400, `群組狀態為 ${group.status}，無法鎖定（需為 full）`)

  const nextBillingDate = new Date();
  if (group.billingCycle === 'yearly') nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
  else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

  const serviceInfoDeadline = new Date();
  serviceInfoDeadline.setHours(serviceInfoDeadline.getHours() + 24)

  const sharedCredentials = typeof sharedCredentialsRaw === 'string' && sharedCredentialsRaw.trim()
    ? encryptCredential(sharedCredentialsRaw.trim())
    : undefined;

  const [updated] = await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: {
        status: 'pending_confirmation',
        serviceInfoDeadline,
        nextBillingDate,
        billingDateAdjustedAt:     null,
        billingDateAdjustmentNote: null,
        ...(sharedCredentials !== undefined && { sharedCredentials }),
      },
      include: HOST_GROUP_INCLUDE,
    }),
    prisma.subscription.updateMany({
      where: { groupId },
      data:  { nextBillingDate },
    }),
  ])

  const groupLabel = group.planName ?? group.service?.name ?? '';
  notifyGroupConversation(groupId, group.hostId, `「${groupLabel}」聊天室已啟用。`).catch(console.error)

  const estimatedDateText = nextBillingDate.toISOString().slice(0, 10).replace(/-/g, '/');[group.hostId, ...group.members.map(m => m.userId)].forEach(userId => {
    notify({
      userId,
      type:    'billing_date_confirmed',
      title:   '預估下次扣款日',
      message: `「${groupLabel}」目前預估下次扣款日為 ${estimatedDateText}，實際日期會在團主啟用服務時重新確認。`,
      meta:    { groupId, nextBillingDate: nextBillingDate.toISOString(), estimated: true },
    })
  })

  const isSharedCredentials = sharedCredentials !== undefined;
  notify({
    userId:  group.hostId,
    type:    'group_chat_opened',
    title:   '群組聊天室已啟用',
    message: `「${groupLabel}」群組已鎖定，聊天室已建立，點擊查看。`,
    meta:    { groupId },
  })
  group.members.forEach(m => {
    notify({
      userId:  m.userId,
      type:    'group_chat_opened',
      title:   '群組聊天室已啟用',
      message: `「${groupLabel}」群組已鎖定，聊天室已建立，點擊查看。`,
      meta:    { groupId },
    })
    notify({
      userId:  m.userId,
      type:    'fill_service_info',
      title:   isSharedCredentials ? '請提取帳號資訊' : '請填寫服務帳號資訊',
      message: isSharedCredentials
        ? `「${groupLabel}」群組已鎖定，請進入提取帳號資訊並完成付款。`
        : `「${groupLabel}」群組已鎖定，請進入填寫服務帳號並完成付款。`,
      meta:    { groupId },
    })
  })

  return updated
}

export async function adjudicateDispute({ groupId, adminId, winner, reason }) {
  if (!['member', 'host'].includes(winner)) throw httpError(400, 'winner 必須為 member 或 host')
  if (!reason?.trim()) throw httpError(400, '請填寫裁定說明')

  const group = await prisma.group.findUnique({
    where:   { id: groupId },
    include: { members: { include: { user: { select: { id: true } } } }, service: { select: { name: true } } },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.status !== 'disputed') throw httpError(400, `群組狀態為 ${group.status}，不在申訴期`)

  const disputeMember = group.members.find(m => m.serviceInfoIssueNote);
  if (!disputeMember) throw httpError(400, '找不到申訴成員')

  const dispute = await prisma.dispute.findFirst({ where: { groupId, status: 'pending' } })
  if (!dispute) throw httpError(400, '找不到進行中的申訴')

  const seatCost = computeSeatCost(group)
  const memberRefundAmount = winner === 'member' ? seatCost : 0
  const hostReleaseAmount = group.escrowTokens - memberRefundAmount
  const groupLabel = group.planName ?? group.service?.name ?? ''
  const trimmedReason = reason.trim()
  const resolutionType = winner === 'member' ? 'member_wins' : 'host_wins'

  await prisma.$transaction(async (tx) => {
    await claimGroupStatus(tx, group.id, {
      fromStatus: 'disputed',
      data:       { status: 'active', disputeDeadline: null, escrowTokens: 0 },
      message:    '這筆申訴剛好已經被處理過了，請重新整理頁面',
    })

    if (memberRefundAmount > 0) {
      await tx.user.update({
        where: { id: disputeMember.userId },
        data:  { tokenBalance: { increment: memberRefundAmount } },
      })
      await tx.tokenTransaction.create({
        data: { userId: disputeMember.userId, type: 'refund', amount: memberRefundAmount, relatedGroupId: group.id, note: `裁定結果：${trimmedReason}（申訴 #${dispute.id}）` },
      })
    }
    if (hostReleaseAmount > 0) {
      await tx.user.update({
        where: { id: group.hostId },
        data:  { tokenBalance: { increment: hostReleaseAmount } },
      })
      await tx.tokenTransaction.create({
        data: { userId: group.hostId, type: 'release', amount: hostReleaseAmount, relatedGroupId: group.id, note: `裁定結果：${trimmedReason}（申訴 #${dispute.id}）` },
      })
    }

    await tx.member.update({
      where: { id: disputeMember.id },
      data:  { serviceInfoIssueNote: null, disputeEvidenceUrl: null },
    })
    await tx.subscription.updateMany({ where: { groupId: group.id }, data: { status: 'active' } })

    await tx.dispute.update({
      where: { id: dispute.id },
      data:  {
        status:             'adjudicated',
        resolutionType,
        resolvedByAdminId:  adminId,
        memberRefundAmount,
        hostReleaseAmount,
        resolutionNote:     trimmedReason,
        resolvedAt:         new Date(),
      },
    })
  });

  const memberMessage = winner === 'member'
    ? `你對「${groupLabel}」回報的問題已確認，本期費用已全額退還至你的PM幣餘額。`
    : `你對「${groupLabel}」回報的問題經確認後不成立，本期費用已撥款給團主，你仍可留在群組內。`
  const hostMessage = winner === 'member'
    ? `「${groupLabel}」的問題處理結果為成員獲勝，該成員本期費用已退還。`
    : `問題處理結果：「${groupLabel}」代管款項已全額撥入你的PM幣餘額。`

  notify({
    userId:  disputeMember.userId,
    type:    'dispute_resolved',
    title:   '問題處理結果',
    message: memberMessage,
    meta:    { groupId: group.id },
  })
  notify({
    userId:  group.hostId,
    type:    winner === 'host' ? 'escrow_released' : 'dispute_resolved',
    title:   winner === 'host' ? '代管款項已撥款' : '問題處理結果',
    message: hostMessage,
    meta:    { groupId: group.id },
  })

  prisma.credentialComment.create({
    data: {
      groupId,
      authorId: adminId,
      content:  `管理員裁定結果：${trimmedReason}`.slice(0, 500),
    },
  }).catch(console.error)

  return { disputeId: dispute.id, resolutionType, memberRefundAmount, hostReleaseAmount }
}

export async function renewGroup({ groupId, hostId }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { include: { user: { select: { id: true, tokenBalance: true } } } } },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'active') throw httpError(400, `群組狀態為 ${group.status}，無法開始新一期（需為 active）`)

  const seatCost = computeSeatCost(group)

  const memberIds = group.members.map(m => m.userId)
  const insufficient = group.members.filter(m => m.user.tokenBalance < seatCost)
  if (insufficient.length > 0) {
    throw httpError(400, `${insufficient.length} 位成員PM幣餘額不足，無法開始新一期收款`, {
      code:      'INSUFFICIENT_BALANCE',
      memberIds: insufficient.map(m => m.userId),
    })
  }

  const base = new Date(group.nextBillingDate ?? new Date())
  if (group.billingCycle === 'yearly') base.setFullYear(base.getFullYear() + 1)
  else base.setMonth(base.getMonth() + 1)

  const serviceInfoDeadline = new Date();
  serviceInfoDeadline.setHours(serviceInfoDeadline.getHours() + 24)

  const updated = await prisma.$transaction(async (tx) => {
    await claimGroupStatus(tx, groupId, {
      fromStatus: 'active',
      data:       { status: 'pending_confirmation' },
    });

    const charged = await tx.user.updateMany({
      where: { id: { in: memberIds }, tokenBalance: { gte: seatCost } },
      data:  { tokenBalance: { decrement: seatCost } },
    });
    if (charged.count !== memberIds.length) throw httpError(409, '部分成員PM幣餘額於扣款當下不足，請稍後重試')

    await tx.tokenTransaction.createMany({
      data: memberIds.map(userId => ({
        userId,
        type:           'escrow',
        amount:         -seatCost,
        relatedGroupId: groupId,
        note:           `新一期代管 ${seatCost} PM`,
      })),
    })

    await tx.member.updateMany({
      where: { groupId },
      data:  { serviceInfo: null, serviceInfoIssueNote: null, confirmedAt: null },
    });

    await tx.subscription.updateMany({
      where: { groupId },
      data:  { nextBillingDate: base },
    });

    return tx.group.update({
      where: { id: groupId },
      data:  {
        status: 'pending_confirmation',
        nextBillingDate: base,
        serviceInfoDeadline,
        escrowTokens: { increment: seatCost * memberIds.length },
        billingDateAdjustedAt:     null,
        billingDateAdjustmentNote: null,
      },
      include: HOST_GROUP_INCLUDE,
    })
  })

  const groupLabel = group.planName ?? '';
  const estimatedDateText = base.toISOString().slice(0, 10).replace(/-/g, '/')
  ;[group.hostId, ...memberIds].forEach(userId => {
    notify({
      userId,
      type:    'billing_date_confirmed',
      title:   '預估下次扣款日',
      message: `「${groupLabel}」新一期目前預估下次扣款日為 ${estimatedDateText}，實際日期會在團主啟用服務時重新確認。`,
      meta:    { groupId, nextBillingDate: base.toISOString(), estimated: true },
    })
  })

  memberIds.forEach(userId => {
    notify({
      userId,
      type:    'group_renewal',
      title:   '新一期已開始',
      message: `「${groupLabel}」群組開始新一期，請前往填寫最新服務帳號資訊。`,
      meta:    { groupId },
    })
  })

  return updated
}
