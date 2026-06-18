import { insertPaymentRecord, readAllPaymentRecords } from '../api/paymentsApi'
import { createId } from '../utils/storage'
import { nowISO, todayISO } from '../utils/date'

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

export function createPaymentRecord({ subscriptionId, amount, periodLabel }) {
  const now     = nowISO()
  const dateStr = todayISO()
  const record = {
    id:             createId('pay'),
    subscriptionId,
    amount,
    paidAt:         now,
    periodLabel:    periodLabel ?? dateStr.slice(0, 7).replace('-', '年') + '月',
  }
  _payments = [..._payments, record]
  insertPaymentRecord(record).catch(console.error)
  return record
}
