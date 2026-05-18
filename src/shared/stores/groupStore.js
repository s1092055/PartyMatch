import { readAllGroups, insertGroup, patchGroup } from '../api/groupsApi'
import { toISODate, todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUserProfile } from './userStore'

export function getGroups() {
  return readAllGroups()
}

export function getGroupById(id) {
  return readAllGroups().find(g => g.id === id) ?? null
}

export function getGroupsByHostId(hostId) {
  return readAllGroups().filter(g => g.hostId === hostId)
}

export function getRecruitingGroups() {
  return readAllGroups().filter(g => g.status === 'recruiting')
}

export function createGroup(data) {
  const activeUser = getActiveUserProfile()
  if (!activeUser) throw new Error('登入後才能建立群組')

  const now = todayISO()
  const group = {
    id:               createId(`group_${data.serviceId}`),
    hostId:           activeUser.id,
    hostName:         activeUser.displayName,
    hostRating:       activeUser.creditScore,
    hostReviewCount:  0,
    hostAvatarInitial: activeUser.avatarInitial,
    hostAvatarColor:  activeUser.avatarColor,
    isHostVerified:   activeUser.isVerified,
    status:           'recruiting',
    createdAt:        now,
    updatedAt:        now,
    usedSeats:        1,
    openSeats:        (data.totalSeats ?? 6) - 1,
    tags:             [],
    rules:            [],
    reviews:          [],
    requirements:     null,
    description:      '',
    ...data,
  }
  return insertGroup(group)
}

export function updateGroup(id, patch) {
  return patchGroup(id, patch)
}

export function confirmGroupPayments(id) {
  return patchGroup(id, { status: 'pending_activation' })
}

export function pauseGroup(id) {
  return patchGroup(id, { status: 'paused' })
}

export function cancelGroup(id) {
  return patchGroup(id, { status: 'cancelled' })
}

export function activateGroup(id) {
  const group = getGroupById(id)
  if (!group) return null

  const activatedAt    = todayISO()
  const activationDate = new Date(activatedAt)
  if (group.billingCycle === 'yearly') {
    activationDate.setFullYear(activationDate.getFullYear() + 1)
  } else {
    activationDate.setMonth(activationDate.getMonth() + 1)
  }
  const nextBillingDate = toISODate(activationDate)
  return patchGroup(id, { status: 'active', activatedAt, nextBillingDate })
}

export function startRenewalCycle(id) {
  const group = getGroupById(id)
  if (!group) return null

  const base = new Date(group.nextBillingDate ?? todayISO())
  if (group.billingCycle === 'yearly') {
    base.setFullYear(base.getFullYear() + 1)
  } else {
    base.setMonth(base.getMonth() + 1)
  }
  const nextBillingDate = toISODate(base)
  return patchGroup(id, { status: 'pending_confirmation', nextBillingDate })
}

export function endGroup(id) {
  return patchGroup(id, { status: 'ended' })
}
