import { decryptCredential } from '../lib/credentialEncryption.js'

export function computeSeatCost(group) {
  const perSeatMonthlyFee = Number(group.perSeatMonthlyFee);
  return group.billingCycle === 'yearly'
    ? Math.round(perSeatMonthlyFee * 12)
    : Math.round(perSeatMonthlyFee)
}

export function toPlainGroup(group) {
  if (!group || group.perSeatMonthlyFee == null) return group
  const plain = { ...group, perSeatMonthlyFee: Number(group.perSeatMonthlyFee) }
  if (typeof plain.sharedCredentials === 'string' && plain.sharedCredentials) {
    plain.sharedCredentials = decryptCredential(plain.sharedCredentials)
  }
  return plain
}
