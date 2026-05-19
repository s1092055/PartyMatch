import { getCurrentUser } from './authStore'

export function getActiveUser() {
  return getCurrentUser()
}

export function getActiveUserProfile() {
  const user = getActiveUser()
  if (!user) return null

  const displayName = user.name ?? user.displayName ?? '使用者'

  return {
    ...user,
    displayName,
    avatarInitial: displayName[0] ?? 'U',
    avatarColor:   user.avatarColor ?? '#3B82F6',
    creditScore:   user.creditScore  ?? 5.0,
    isVerified:    user.isVerified   ?? false,
    // TODO (Firebase): query subscriptions collection where userId == uid
    joinedGroups:  [],
    // TODO (Firebase): query groups collection where hostId == uid
    hostedGroups:  [],
    createdAt:     user.joinedAt,
  }
}
