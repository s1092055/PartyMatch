const CUSTOM_TOAST_IDS = {
  new_application: 'pm-new-application',
}

export function getNotificationToastId(notification) {
  if (!notification) return null
  const { type, meta, id } = notification
  return CUSTOM_TOAST_IDS[type] ?? (meta?.groupId ? `pm-${type}-${meta.groupId}` : id) ?? null
}
