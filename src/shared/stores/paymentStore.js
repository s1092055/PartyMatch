import { readAllPaymentRecords, insertPaymentRecord } from '../api/paymentsApi'
import { currentPeriodLabel, todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUser } from './userStore'

let _payments = []

export async function initPayments() {
  _payments = await readAllPaymentRecords()
}

export function getPaymentRecords() { return _payments }

export function getPaymentRecordsBySubscriptionId(subscriptionId) {
  return _payments.filter(p => p.subscriptionId === subscriptionId)
}

export function getPaymentRecordsByUserId(subscriptionIds) {
  if (!subscriptionIds?.length) return []
  const ids = new Set(subscriptionIds)
  return _payments.filter(p => ids.has(p.subscriptionId))
}

export function createPaymentRecord({ subscriptionId, groupId, serviceName, planName, amount, method = 'manual' }) {
  const activeUser = getActiveUser()
  const record = {
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
  }
  _payments.push(record)
  insertPaymentRecord(record).catch(console.error)
  return record
}
