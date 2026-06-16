import { readAllSubscriptions, insertSubscription, patchSubscription } from '../api/subscriptionsApi'
import { normalizeSubscription } from '../utils/modelNormalizers'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getCurrentUser } from './authStore'

let _subs = []

function emitSubscriptionsChanged(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('pm:subscriptions-changed', { detail }))
}

export async function initSubscriptions() {
  _subs = await readAllSubscriptions()
}

export function getSubscriptionsByUserId(userId) {
  return _subs.filter(s => s.userId === userId)
}

export function getSubscriptionsByGroupId(groupId) {
  return _subs.filter(s => s.groupId === groupId)
}

export function getSubscriptionByUserAndGroup(userId, groupId) {
  return _subs.find(s => s.userId === userId && s.groupId === groupId) ?? null
}

export function createSubscription({ userId, groupId, serviceName, planName, serviceId, hostName, hostAvatarInitial, hostAvatarColor, pricePerSeat, billingCycle, nextBillingDate }) {
  const activeUser = getCurrentUser()
  const now = todayISO()
  const targetUserId = userId ?? activeUser?.id ?? null
  const existingSub = getSubscriptionByUserAndGroup(targetUserId, groupId)
  if (existingSub) return existingSub

  const sub = normalizeSubscription({
    id:               createId('sub'),
    userId:           targetUserId,
    groupId,
    serviceName,
    planName,
    serviceId,
    hostName,
    hostAvatarInitial,
    hostAvatarColor,
    pricePerSeat,
    billingCycle,
    nextBillingDate,
    joinedAt:         now,
    paymentStatus:    'pending',
    status:           'pending_payment',
    createdAt:        now,
    updatedAt:        now,
  })
  _subs.push(sub)
  emitSubscriptionsChanged({ type: 'created', subscription: sub })
  insertSubscription(sub).catch(console.error)
  return sub
}

function applyPatch(id, patch) {
  let updatedSub = null
  _subs = _subs.map(s => {
    if (s.id !== id) return s
    updatedSub = normalizeSubscription({ ...s, ...patch })
    return updatedSub
  })
  return updatedSub
}

export function markSubscriptionPaid(id) {
  const patch = { paymentStatus: 'markedPaid', lastPaidAt: todayISO() }
  const updatedSub = applyPatch(id, patch)
  if (updatedSub) emitSubscriptionsChanged({ type: 'payment_marked', subscription: updatedSub })
  patchSubscription(id, patch).catch(console.error)
}

export function confirmSubscriptionPayment(id) {
  const patch = { paymentStatus: 'confirmed' }
  const updatedSub = applyPatch(id, patch)
  if (updatedSub) emitSubscriptionsChanged({ type: 'payment_confirmed', subscription: updatedSub })
  patchSubscription(id, patch).catch(console.error)
}

export function activateGroupSubscriptions(groupId, nextBillingDate) {
  const patch = { status: 'active', nextBillingDate }
  const targets = _subs.filter(s => s.groupId === groupId)
  _subs = _subs.map(s => s.groupId === groupId ? normalizeSubscription({ ...s, ...patch }) : s)
  if (targets.length) emitSubscriptionsChanged({ type: 'group_activated', groupId })
  targets.forEach(s => patchSubscription(s.id, patch).catch(console.error))
}

export function resetSubscriptionPaymentsForGroup(groupId) {
  const patch = { paymentStatus: 'pending' }
  const targets = _subs.filter(s => s.groupId === groupId)
  _subs = _subs.map(s => s.groupId === groupId ? normalizeSubscription({ ...s, ...patch }) : s)
  if (targets.length) emitSubscriptionsChanged({ type: 'renewal_started', groupId })
  targets.forEach(s => patchSubscription(s.id, patch).catch(console.error))
}
