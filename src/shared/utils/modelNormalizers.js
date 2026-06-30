export function normalizeConversation(conv) {
  const group   = conv.group   ?? {}
  const service = group.service ?? {}
  // group 對話：serviceId / name 從巢狀 group.service 提取
  if (conv.type === 'group') {
    return {
      ...conv,
      serviceId: conv.serviceId ?? service.id  ?? '',
      name:      conv.name      ?? service.name ?? group.planName ?? '群組對話',
      hostId:    conv.hostId    ?? group.hostId ?? '',
    }
  }
  // DM 對話：保留原始結構，name/avatarInitial/avatarColor 由 MessagesModal 從 participantMeta 推導
  return conv
}

export function normalizeMember(m) {
  const user = m.user ?? {}
  const userName = m.userName ?? user.name ?? '成員'
  const joinedAt = m.joinedAt ? String(m.joinedAt).slice(0, 10) : ''

  return {
    ...m,
    userName,
    userAvatarInitial: m.userAvatarInitial ?? user.avatarInitial ?? userName[0] ?? '?',
    userAvatarColor:   m.userAvatarColor   ?? user.avatarColor   ?? '#94A3B8',
    userId:            m.userId            ?? user.id            ?? '',
    paymentStatus:     m.paymentStatus     ?? 'pending',
    joinedAt,
  }
}

export function normalizeApplication(app) {
  // 後端回傳巢狀 user（申請人）和 group（含 service、host）
  const user    = app.user    ?? {}
  const group   = app.group   ?? {}
  const service = group.service ?? {}
  const host    = group.host    ?? {}

  const applicantId   = app.applicantId   ?? app.userId   ?? user.id   ?? ''
  const applicantName = app.applicantName ?? app.userName ?? user.name ?? '申請者'

  const createdAt = app.createdAt
    ? String(app.createdAt).slice(0, 10)
    : ''

  return {
    ...app,
    applicantId,
    applicantName,
    applicantAvatarInitial: app.applicantAvatarInitial ?? user.avatarInitial ?? applicantName[0] ?? '?',
    applicantAvatarColor:   app.applicantAvatarColor   ?? user.avatarColor   ?? '#94A3B8',
    applicantCreditScore:   app.applicantCreditScore   ?? user.creditScore   ?? 80,
    userId:                 app.userId ?? applicantId,
    userName:               app.userName ?? applicantName,
    userAvatarInitial:      app.userAvatarInitial ?? user.avatarInitial ?? applicantName[0] ?? '?',
    userAvatarColor:        app.userAvatarColor   ?? user.avatarColor   ?? '#94A3B8',
    // 群組 / 服務資訊（從巢狀 group 展平）
    groupId:    app.groupId   ?? group.id      ?? '',
    groupName:  app.groupName ?? service.name  ?? '未命名群組',
    serviceName: app.serviceName ?? service.name ?? '',
    serviceId:   app.serviceId   ?? service.id  ?? group.serviceId ?? '',
    planName:    app.planName    ?? group.planName ?? '',
    // 團主資訊（從巢狀 group.host 展平）
    hostId:            app.hostId            ?? group.hostId   ?? host.id   ?? '',
    hostName:          app.hostName          ?? host.name      ?? '',
    hostAvatarInitial: app.hostAvatarInitial ?? host.avatarInitial ?? '',
    hostAvatarColor:   app.hostAvatarColor   ?? host.avatarColor   ?? '#94A3B8',
    status:    app.status ?? 'pending',
    createdAt,
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
    groupStatus:       sub.groupStatus ?? group.status ?? '',
    // 服務資訊
    serviceName:       sub.serviceName  ?? service.name    ?? group.planName  ?? '',
    serviceId:         sub.serviceId    ?? service.id      ?? group.serviceId ?? '',
    planName:          sub.planName     ?? group.planName  ?? '',
    pricePerSeat:      sub.pricePerSeat ?? group.monthlyFee ?? 0,
    // 團主資訊
    hostName:          sub.hostName          ?? host.name          ?? '',
    hostAvatarInitial: sub.hostAvatarInitial ?? host.avatarInitial ?? '',
    hostAvatarColor:   sub.hostAvatarColor   ?? host.avatarColor   ?? '#94A3B8',
    createdAt,
    joinedAt:          sub.joinedAt ?? createdAt,
  }
}
