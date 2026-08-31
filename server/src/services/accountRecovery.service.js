import prisma from '../lib/prisma.js'

export const SELF_RECOVERY_WINDOW_DAYS = 30

export function isWithinRecoveryWindow(deactivatedAt) {
  if (!deactivatedAt) return false
  const elapsedMs = Date.now() - new Date(deactivatedAt).getTime()
  return elapsedMs <= SELF_RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

export async function reactivateUserAccount(userId) {
  await prisma.user.update({ where: { id: userId }, data: { deactivatedAt: null } })
}
