import { readAllPaymentRecords, insertPaymentRecord } from '../api/paymentsApi'
import { currentPeriodLabel, todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUser } from './userStore'

export function getPaymentRecords() {
  return readAllPaymentRecords()
}

export function getPaymentRecordsBySubscriptionId(subscriptionId) {
  return readAllPaymentRecords().filter(p => p.subscriptionId === subscriptionId)
}

export function getPaymentRecordsByUserId(subscriptionIds) {
  if (!subscriptionIds?.length) return []
  const ids = new Set(subscriptionIds)
  return readAllPaymentRecords().filter(p => ids.has(p.subscriptionId))
}

export function createPaymentRecord({ subscriptionId, groupId, serviceName, planName, amount, method = 'manual' }) {
  const activeUser = getActiveUser()
  return insertPaymentRecord({
    id:            createId('pay'),
    subscriptionId,
    groupId:       groupId ?? null,
    userId:        activeUser?.id ?? null,
    serviceName:   serviceName ?? '',
    planName:      planName ?? '',
    amount,
    paidAt:        todayISO(),
    periodLabel:   currentPeriodLabel(),
    status:        'paid',
    method,
  })
}
