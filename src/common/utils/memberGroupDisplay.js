import { isEffectivelyActive, canReportServiceIssue } from './groupStatus'
import { hasFilledServiceInfo, isSharedCredentialsMethod } from './serviceInfoFields'

export function getMemberJoinedBadgeVariant(status, isMember) {
  return isMember && status === 'recruiting' ? 'member_joined' : undefined
}

export function getGroupFooterAction({ activeUserId, isHost, isWaitingMembers, needsFillInfo, isMember, isFull }) {
  if (!activeUserId) return 'login'
  if (isHost) return 'host'
  if (isWaitingMembers) return 'waiting'
  if (needsFillInfo) return 'fillInfo'
  if (isMember) return 'member'
  if (isFull) return 'full'
  return null
}

export function getSubscriptionBadgeStatus(sub) {
  const status = sub.groupStatus ?? sub.status
  // 群組進入 disputed 時，只有提出問題的當事人自己會被視為問題處理中，
  // 其他成員的確認進度不受影響，比照一般確認期顯示
  const effectiveStatus = status === 'disputed' && !sub.serviceInfoIssueNote ? 'confirming' : status
  return isEffectivelyActive(effectiveStatus, sub.confirmedAt) ? 'active' : effectiveStatus
}

export function getSubscriptionBillingDisplay(rawStatus) {
  const isPreBillingLock = canReportServiceIssue(rawStatus)
  const showsBillingDate = isPreBillingLock || rawStatus === 'confirming' || rawStatus === 'disputed'
  return { isPreBillingLock, showsBillingDate }
}

export function getSubscriptionCardBadge(sub, { sharingMethod, displayStatus }) {
  const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
  const waitingForOthers = displayStatus === 'pending_confirmation' &&
    hasFilledServiceInfo(sub.serviceInfo, sharingMethod) && !sub.serviceInfoIssueNote

  return {
    status: waitingForOthers ? 'active' : displayStatus === 'recruiting' ? 'member_joined' : displayStatus,
    label:
      waitingForOthers ? (isSharedCredentials ? '已提取完成' : '已填寫完成') :
      displayStatus === 'full' ? '等待鎖定' :
      displayStatus === 'pending_confirmation' && isSharedCredentials ? '帳號提取中' :
      undefined,
  }
}

export function getMemberGroupFlags({ status, sub, myMember, hasServiceInfo, hasServiceInfoIssue }) {
  const isPaymentRelevant = !['recruiting', 'full', 'cancelled'].includes(status)
  const isDisputed = status === 'disputed'
  const isDisputeRaiser = isDisputed && !!myMember?.serviceInfoIssueNote
  // 確認期每位成員彼此獨立：group 進入 disputed 只影響提出問題的當事人本人，
  // 其他成員不受影響，繼續當成一般確認期處理
  const isConfirmingLike = status === 'confirming' || (isDisputed && !isDisputeRaiser)
  const needsFillInfo = !!sub && isPaymentRelevant && !hasServiceInfo && status === 'pending_confirmation'
  const waitingForOthers = !!sub && hasServiceInfo && status === 'pending_confirmation'
  const canConfirm = isConfirmingLike && !!myMember && !myMember.confirmedAt
  const alreadyConfirmed = isConfirmingLike && !!myMember?.confirmedAt

  return {
    isPaymentRelevant,
    showMessagesButton: isPaymentRelevant && status !== 'ended',
    needsFillInfo,
    waitingForOthers,
    canConfirm,
    alreadyConfirmed,
    isDisputed,
    isDisputeRaiser,
    canLeaveGroup: ['recruiting', 'full'].includes(status) && !!myMember,
    showReviewHostButton: ['active', 'ended'].includes(status),
    hasServiceInfoIssue,
  }
}

export const DISPUTED_BANNER_TEXT = '回報處理中'

export function getMemberGroupBadges({ status, sub, isSharedCredentials, flags }) {
  const { hasServiceInfoIssue, needsFillInfo, waitingForOthers, canConfirm, isDisputed, isDisputeRaiser, alreadyConfirmed } = flags

  const statusBadgeOverride =
    alreadyConfirmed ? { variant: 'active' } :
    canConfirm && isDisputed ? 'confirming' :
    waitingForOthers ? { variant: 'active', label: isSharedCredentials ? '已提取完成' : '已填寫完成' } :
    status === 'recruiting' && !!sub ? 'member_joined' :
    status === 'full' ? { variant: 'full', label: '等待鎖定' } :
    status === 'pending_confirmation' && isSharedCredentials ? { variant: 'pending_confirmation', label: '帳號提取中' } :
    undefined

  const pendingBadge =
    hasServiceInfoIssue ? '帳號資訊有問題' :
    needsFillInfo       ? (isSharedCredentials ? '請提取帳號資訊' : '請填寫服務帳號以完成加入流程') :
    waitingForOthers    ? '已填寫完成' :
    canConfirm           ? '確認期進行中，請確認服務' :
    isDisputeRaiser      ? DISPUTED_BANNER_TEXT :
    status === 'full' && !!sub ? '招募完成，等待團主鎖定群組' :
    status === 'recruiting' && !!sub ? '已通過申請，需等待其他人加入' :
    undefined

  const pendingBadgeColor =
    (status === 'full' && !!sub) ? 'gray' :
    (status === 'recruiting' && !!sub) ? 'success' :
    hasServiceInfoIssue ? 'danger' :
    waitingForOthers ? 'success' :
    canConfirm ? 'brand' :
    isDisputeRaiser ? 'danger' :
    undefined

  return { statusBadgeOverride, pendingBadge, pendingBadgeColor }
}
