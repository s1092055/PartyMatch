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

// Migrate old 0–5 rating scale → 0–100. Values > 5 are already on the new scale.
function migrateRating(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 80
  return n > 0 && n <= 5 ? Math.round(n * 20) : n
}

export function normalizeGroup(group) {
  // 後端回傳巢狀 service / host 物件，前端元件使用扁平欄位，在此統一對應
  const service = group.service ?? {}
  const host    = group.host    ?? {}
  const memberCount = group._count?.members ?? group.currentMembers ?? 0

  const serviceName = group.serviceName ?? service.name ?? ''
  const pricePerSeat = group.pricePerSeat ?? group.monthlyFee ?? 0
  const totalSeats   = Number(group.totalSeats ?? group.maxMembers ?? 0)
  // usedSeats = 成員數 + 團主(1)
  const usedSeats    = Number(group.usedSeats ?? (memberCount + 1))
  const openSeats    = Number.isFinite(Number(group.openSeats))
    ? Number(group.openSeats)
    : Math.max(totalSeats - usedSeats, 0)

  // 日期格式：MySQL 回傳完整 ISO datetime，只取 YYYY-MM-DD 顯示
  const createdAt = group.createdAt
    ? String(group.createdAt).slice(0, 10)
    : ''

  return {
    ...group,
    // 服務資訊
    serviceName,
    serviceId: group.serviceId ?? service.id ?? '',
    pricePerSeat,
    monthlyFee: group.monthlyFee ?? pricePerSeat,
    // 席位
    totalSeats,
    maxMembers: group.maxMembers ?? totalSeats,
    usedSeats,
    openSeats,
    // 團主資訊（從巢狀 host 物件展平）
    hostName:          group.hostName          ?? host.name          ?? '',
    hostRating:        migrateRating(group.hostRating ?? host.creditScore ?? 80),
    hostAvatarInitial: group.hostAvatarInitial ?? host.avatarInitial ?? '',
    hostAvatarColor:   group.hostAvatarColor   ?? host.avatarColor   ?? '#94A3B8',
    hostReviewCount:   group.hostReviewCount   ?? 0,
    // 其他
    rules:     Array.isArray(group.rules) ? group.rules : (group.rules ? [group.rules] : []),
    tags:      Array.isArray(group.tags)  ? group.tags  : [],
    status:    group.status ?? 'recruiting',
    createdAt,
  }
}

export function normalizeSubscription(sub) {
  // 後端回傳巢狀 group（含 service / host），在此展平成前端元件使用的扁平欄位
  const group   = sub.group   ?? {}
  const service = group.service ?? sub.service ?? {}
  const host    = group.host    ?? sub.host    ?? {}

  const createdAt = sub.createdAt
    ? String(sub.createdAt).slice(0, 10)
    : ''

  return {
    ...sub,
    paymentStatus:     sub.paymentStatus ?? sub.status ?? 'pending',
    status:            sub.status ?? 'pending',
    // 服務資訊
    serviceName:       sub.serviceName       ?? service.name ?? group.planName ?? '',
    serviceId:         sub.serviceId         ?? service.id   ?? group.serviceId ?? '',
    planName:          sub.planName          ?? group.planName ?? '',
    pricePerSeat:      sub.pricePerSeat      ?? group.monthlyFee ?? 0,
    // 團主資訊
    hostName:          sub.hostName          ?? host.name          ?? '',
    hostAvatarInitial: sub.hostAvatarInitial ?? host.avatarInitial ?? '',
    hostAvatarColor:   sub.hostAvatarColor   ?? host.avatarColor   ?? '#94A3B8',
    createdAt,
  }
}
