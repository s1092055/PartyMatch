import { readAllGroups, insertGroup, patchGroup } from '../api/groupsApi'
import { toISODate, todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUserProfile } from './userStore'
import { normalizeGroup } from '../utils/modelNormalizers'

// In-memory cache — populated once on app startup by initGroups()
let _groups = []

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// Called once in App.jsx before the router renders
export async function initGroups() {
  const all = await readAllGroups()
  _groups = DEMO_MODE ? all : all.filter(g => !g._demo)
}

function applyPatch(id, patch) {
  _groups = _groups.map(g => g.id === id ? normalizeGroup({ ...g, ...patch }) : g)
  return _groups.find(g => g.id === id) ?? null
}

// ── Reads (sync, from cache) ───────────────────────────────────────

export function getGroups()                  { return _groups }
export function getGroupById(id)             { return _groups.find(g => g.id === id) ?? null }
export function getGroupsByHostId(hostId)    { return _groups.filter(g => g.hostId === hostId) }
export function getRecruitingGroups()        { return _groups.filter(g => g.status === 'recruiting') }

// ── Writes (optimistic: update cache sync, persist async) ─────────

export function createGroup(data) {
  const activeUser = getActiveUserProfile()
  if (!activeUser) throw new Error('登入後才能建立群組')

  const now   = todayISO()
  const group = normalizeGroup({
    id:                createId(`group_${data.serviceId}`),
    hostId:            activeUser.id,
    hostName:          activeUser.displayName,
    hostRating:        activeUser.creditScore,
    hostReviewCount:   0,
    hostAvatarInitial: activeUser.avatarInitial,
    hostAvatarColor:   activeUser.avatarColor,
    isHostVerified:    activeUser.isVerified,
    status:            'recruiting',
    createdAt:         now,
    updatedAt:         now,
    usedSeats:         1,
    openSeats:         (data.totalSeats ?? 6) - 1,
    tags:              [],
    rules:             [],
    reviews:           [],
    requirements:      null,
    description:       '',
    ...data,
  })

  _groups = [..._groups, group]
  insertGroup(group).catch(err => console.error('[groupStore] createGroup failed:', err))
  return group
}

export function updateGroup(id, patch) {
  const updated = applyPatch(id, patch)
  patchGroup(id, patch).catch(err => console.error('[groupStore] updateGroup failed:', err))
  return updated
}

export function confirmGroupPayments(id) {
  return updateGroup(id, { status: 'pending_activation' })
}

export function pauseGroup(id) {
  return updateGroup(id, { status: 'paused' })
}

export function cancelGroup(id) {
  return updateGroup(id, { status: 'cancelled' })
}

export function activateGroup(id, customNextBillingDate = null) {
  const group = getGroupById(id)
  if (!group) return null

  const activatedAt = todayISO()
  let nextBillingDate = customNextBillingDate
  if (!nextBillingDate) {
    const activationDate = new Date(activatedAt)
    if (group.billingCycle === 'yearly') {
      activationDate.setFullYear(activationDate.getFullYear() + 1)
    } else {
      activationDate.setMonth(activationDate.getMonth() + 1)
    }
    nextBillingDate = toISODate(activationDate)
  }
  return updateGroup(id, { status: 'active', activatedAt, nextBillingDate })
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
  return updateGroup(id, { status: 'pending_confirmation', nextBillingDate })
}

export function endGroup(id) {
  return updateGroup(id, { status: 'ended' })
}
