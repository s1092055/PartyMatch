import { readAllSubscriptions, insertSubscription, patchSubscription } from '../api/subscriptionsApi'
import { normalizeSubscription } from '../utils/modelNormalizers'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUser } from './userStore'

export function getSubscriptions() {
  return readAllSubscriptions()
}

export function getSubscriptionsByUserId(userId) {
  return readAllSubscriptions().filter(s => s.userId === userId)
}

export function getSubscriptionById(id) {
  return readAllSubscriptions().find(s => s.id === id) ?? null
}

export function getSubscriptionByUserAndGroup(userId, groupId) {
  return readAllSubscriptions().find(s => s.userId === userId && s.groupId === groupId) ?? null
}

export function createSubscription({ userId, groupId, serviceName, planName, serviceId, hostName, hostAvatarInitial, hostAvatarColor, pricePerSeat, billingCycle, nextBillingDate }) {
  const activeUser = getActiveUser()
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
  return insertSubscription(sub)
}

export function updateSubscription(id, patch) {
  return patchSubscription(id, patch)
}

export function markSubscriptionPaid(id) {
  return patchSubscription(id, { paymentStatus: 'markedPaid', lastPaidAt: todayISO() })
}

export function confirmSubscriptionPayment(id) {
  return patchSubscription(id, { paymentStatus: 'confirmed' })
}

export function activateGroupSubscriptions(groupId, nextBillingDate) {
  readAllSubscriptions()
    .filter(s => s.groupId === groupId)
    .forEach(s => patchSubscription(s.id, { status: 'active', nextBillingDate }))
}
