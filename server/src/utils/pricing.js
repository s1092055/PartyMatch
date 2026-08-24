import { decryptCredential } from '../lib/credentialEncryption.js'

export function computeSeatCost(group) {
  const monthlyFee = Number(group.monthlyFee);
  return group.billingCycle === 'yearly'
    ? Math.round(monthlyFee * 12)
    : Math.round(monthlyFee)
}

export function toPlainGroup(group) {
  if (!group || group.monthlyFee == null) return group
  const plain = { ...group, monthlyFee: Number(group.monthlyFee) }
  if (typeof plain.sharedCredentials === 'string' && plain.sharedCredentials) {
    plain.sharedCredentials = decryptCredential(plain.sharedCredentials)
  }
  return plain
}
