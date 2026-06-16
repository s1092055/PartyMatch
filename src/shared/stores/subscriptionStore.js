import { readAllSubscriptions, insertSubscription, patchSubscription } from '../api/subscriptionsApi'
import { normalizeSubscription } from '../utils/modelNormalizers'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getCurrentUser } from './authStore'

let _subs = []

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export async function initSubscriptions() {
  const all = await readAllSubscriptions()
  _subs = DEMO_MODE ? all : all.filter(s => !s._demo)
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
  const sub = normalizeSubscription({
    id:               createId('sub'),
    userId:           userId ?? activeUser?.id ?? null,
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
  insertSubscription(sub).catch(console.error)
  return sub
}

function applyPatch(id, patch) {
  _subs = _subs.map(s => s.id === id ? normalizeSubscription({ ...s, ...patch }) : s)
}

export function markSubscriptionPaid(id) {
  const patch = { paymentStatus: 'markedPaid', lastPaidAt: todayISO() }
  applyPatch(id, patch)
  patchSubscription(id, patch).catch(console.error)
}

export function confirmSubscriptionPayment(id) {
  const patch = { paymentStatus: 'confirmed' }
  applyPatch(id, patch)
  patchSubscription(id, patch).catch(console.error)
}

export function activateGroupSubscriptions(groupId, nextBillingDate) {
  const patch = { status: 'active', nextBillingDate }
  const targets = _subs.filter(s => s.groupId === groupId)
  _subs = _subs.map(s => s.groupId === groupId ? normalizeSubscription({ ...s, ...patch }) : s)
  targets.forEach(s => patchSubscription(s.id, patch).catch(console.error))
}

export function resetSubscriptionPaymentsForGroup(groupId) {
  const patch = { paymentStatus: 'pending' }
  const targets = _subs.filter(s => s.groupId === groupId)
  _subs = _subs.map(s => s.groupId === groupId ? normalizeSubscription({ ...s, ...patch }) : s)
  targets.forEach(s => patchSubscription(s.id, patch).catch(console.error))
}
