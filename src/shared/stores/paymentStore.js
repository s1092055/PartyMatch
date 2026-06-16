import { readAllPaymentRecords } from '../api/paymentsApi'

let _payments = []

export async function initPayments() {
  _payments = await readAllPaymentRecords()
}

export function getPaymentRecordsBySubscriptionId(subscriptionId) {
  return _payments.filter(p => p.subscriptionId === subscriptionId)
}

export function getPaymentRecordCountBySubIds(subIds) {
  const idSet = new Set(subIds)
  return _payments.filter(p => idSet.has(p.subscriptionId)).length
}
