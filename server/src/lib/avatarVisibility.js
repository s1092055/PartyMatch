export function maskAvatar(user) {
  if (!user) return user
  const { showAvatar, ...rest } = user
  if (showAvatar === false) {
    return { ...rest, avatarInitial: null, avatarColor: null }
  }
  return rest
}
