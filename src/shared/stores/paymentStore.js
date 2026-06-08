import { readAllPaymentRecords } from '../api/paymentsApi'

let _payments = []

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export async function initPayments() {
  const all = await readAllPaymentRecords()
  _payments = DEMO_MODE ? all : all.filter(p => !p._demo)
}

export function getPaymentRecordsBySubscriptionId(subscriptionId) {
  return _payments.filter(p => p.subscriptionId === subscriptionId)
}
