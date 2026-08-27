export function normalizeApplication(app) {
  const applicantId = app.applicantId ?? app.userId
  const applicantName = app.applicantName ?? app.userName ?? '申請者'

  return {
    ...app,
    applicantId,
    applicantName,
    applicantAvatarInitial: app.applicantAvatarInitial ?? app.userAvatarInitial ?? applicantName[0],
    applicantAvatarColor: app.applicantAvatarColor ?? app.userAvatarColor ?? '#94A3B8',
    userId: app.userId ?? applicantId,
    userName: app.userName ?? applicantName,
    userAvatarInitial: app.userAvatarInitial ?? app.applicantAvatarInitial ?? applicantName[0],
    userAvatarColor: app.userAvatarColor ?? app.applicantAvatarColor ?? '#94A3B8',
    groupName: app.groupName ?? app.serviceName ?? '未命名群組',
    status: app.status ?? 'pending',
  }
}

export function normalizeGroup(group) {
  const totalSeats = Number(group.totalSeats ?? 0)
  const usedSeats = Number(group.usedSeats ?? 0)

  return {
    ...group,
    totalSeats,
    usedSeats,
    openSeats: Number.isFinite(Number(group.openSeats))
      ? Number(group.openSeats)
      : Math.max(totalSeats - usedSeats, 0),
    rules: Array.isArray(group.rules) ? group.rules : [],
    tags: Array.isArray(group.tags) ? group.tags : [],
    status: group.status ?? 'recruiting',
  }
}

export function normalizeSubscription(sub) {
  return {
    ...sub,
    paymentStatus: sub.paymentStatus ?? 'pending',
    status: sub.status ?? 'active',
  }
}
