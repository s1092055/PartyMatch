export function normalizeMessage(msg) {
  const sender = msg.sender ?? {}
  return {
    ...msg,
    text:          msg.text          ?? msg.content        ?? '',
    senderName:    msg.senderName    ?? sender.name        ?? '',
    avatarInitial: msg.avatarInitial ?? sender.avatarInitial ?? '',
    avatarColor:   msg.avatarColor   ?? sender.avatarColor   ?? '#64718A',
    presenceStatus: msg.presenceStatus ?? sender.presenceStatus ?? 'offline',
  }
}

function extractLastMessage(conv) {
  const raw = conv.lastMessage
  if (!raw) return { lastMessage: '', lastMessageAt: conv.updatedAt ?? null }
  if (typeof raw === 'object') {
    return {
      lastMessage:   raw.content   ?? '',
      lastMessageAt: raw.createdAt ?? conv.updatedAt ?? null,
    }
  }
  return { lastMessage: raw, lastMessageAt: conv.updatedAt ?? null }
}

export function normalizeConversation(conv) {
  const group   = conv.group   ?? {}
  const service = group.service ?? {}
  const { lastMessage, lastMessageAt } = extractLastMessage(conv)

  if (conv.type === 'group') {
    return {
      ...conv,
      serviceId:     conv.serviceId ?? service.id   ?? '',
      name:          conv.name      ?? service.name ?? group.planName ?? '群組對話',
      hostId:        conv.hostId    ?? group.hostId ?? '',
      lastMessage,
      lastMessageAt,
    }
  }
  return { ...conv, lastMessage, lastMessageAt }
}

export function normalizeMember(m) {
  const user = m.user ?? {}
  const userName = m.userName ?? user.name ?? '成員'
  const joinedAtTime = m.joinedAt ?? '';
  const joinedAt = m.joinedAt ? String(m.joinedAt).slice(0, 10) : ''

  return {
    ...m,
    userName,
    userAvatarInitial: m.userAvatarInitial ?? user.avatarInitial ?? '',
    userAvatarColor:   m.userAvatarColor   ?? user.avatarColor   ?? '#64718A',
    userPresenceStatus: m.userPresenceStatus ?? user.presenceStatus ?? 'offline',
    userBio:           m.userBio           ?? user.bio           ?? '',
    userId:            m.userId            ?? user.id            ?? '',
    joinedAt,
    joinedAtTime,
  };
}

export function normalizeApplication(app) {
  const user    = app.user    ?? {};
  const group   = app.group   ?? {}
  const service = group.service ?? {}
  const host    = group.host    ?? {}

  const applicantId   = app.applicantId   ?? app.userId   ?? user.id   ?? ''
  const applicantName = app.applicantName ?? app.userName ?? user.name ?? '申請者'

  const createdAt = app.createdAt ? String(app.createdAt) : '';

  return {
    ...app,
    applicantId,
    applicantName,
    applicantAvatarInitial: app.applicantAvatarInitial ?? user.avatarInitial ?? '',
    applicantAvatarColor:   app.applicantAvatarColor   ?? user.avatarColor   ?? '#64718A',
    applicantPresenceStatus: app.applicantPresenceStatus ?? user.presenceStatus ?? 'offline',
    applicantCreditScore:   app.applicantCreditScore   ?? user.creditScore   ?? 80,
    userId:                 app.userId ?? applicantId,
    userName:               app.userName ?? applicantName,
    userAvatarInitial:      app.userAvatarInitial ?? user.avatarInitial ?? '',
    userAvatarColor:        app.userAvatarColor   ?? user.avatarColor   ?? '#64718A',
    userPresenceStatus:     app.userPresenceStatus ?? user.presenceStatus ?? 'offline',
    groupId: app.groupId   ?? group.id      ?? '',
    groupName:  app.groupName ?? service.name  ?? '未命名群組',
    serviceName: app.serviceName ?? service.name ?? '',
    serviceId:   app.serviceId   ?? service.id  ?? group.serviceId ?? '',
    planName:    app.planName    ?? group.planName ?? '',
    hostId: app.hostId            ?? group.hostId   ?? host.id   ?? '',
    hostName:          app.hostName          ?? host.name      ?? '',
    hostAvatarInitial: app.hostAvatarInitial ?? host.avatarInitial ?? '',
    hostAvatarColor:   app.hostAvatarColor   ?? host.avatarColor   ?? '#64718A',
    hostPresenceStatus: app.hostPresenceStatus ?? host.presenceStatus ?? 'offline',
    status:    app.status ?? 'pending',
    createdAt,
  };
}

function migrateRating(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 80
  return n > 0 && n <= 5 ? Math.round(n * 20) : n
}

export function normalizeGroup(group) {
  const service = group.service ?? {};
  const host    = group.host    ?? {}
  const memberCount = group._count?.members ?? group.currentMembers ?? 0

  const serviceName = group.serviceName ?? service.name ?? ''
  const pricePerSeat = group.pricePerSeat ?? group.monthlyFee ?? 0
  const totalSeats   = Number(group.totalSeats ?? group.maxMembers ?? 0)
  const usedSeats    = memberCount + 1;
  const openSeats    = Math.max(totalSeats - usedSeats, 0);

  const createdAt = group.createdAt
    ? String(group.createdAt).slice(0, 10)
    : '';

  return {
    ...group,
    serviceName,
    serviceId: group.serviceId ?? service.id ?? '',
    pricePerSeat,
    monthlyFee: group.monthlyFee ?? pricePerSeat,
    totalSeats,
    maxMembers: group.maxMembers ?? totalSeats,
    usedSeats,
    openSeats,
    hostName: group.hostName          ?? host.name          ?? '',
    hostRating:        migrateRating(group.hostRating ?? host.creditScore ?? 80),
    hostAvatarInitial: group.hostAvatarInitial ?? host.avatarInitial ?? '',
    hostAvatarColor:   group.hostAvatarColor   ?? host.avatarColor   ?? '#64718A',
    hostPresenceStatus: group.hostPresenceStatus ?? host.presenceStatus ?? 'offline',
    hostBio:           group.hostBio           ?? host.bio           ?? '',
    hostReviewCount:   group.hostReviewCount   ?? 0,
    rules: Array.isArray(group.rules) ? group.rules : (group.rules ? group.rules.split('\n').filter(Boolean) : []),
    tags:      Array.isArray(group.tags)  ? group.tags  : [],
    status:    group.status ?? 'recruiting',
    createdAt,
  };
}

export function normalizeSubscription(sub) {
  const group   = sub.group   ?? {};
  const service = group.service ?? sub.service ?? {}
  const host    = group.host    ?? sub.host    ?? {}

  const createdAt = sub.createdAt
    ? String(sub.createdAt).slice(0, 10)
    : ''

  return {
    ...sub,
    status:            sub.status ?? 'pending',
    groupStatus:       sub.groupStatus ?? group.status ?? '',
    serviceName: sub.serviceName  ?? service.name    ?? group.planName  ?? '',
    serviceId:         sub.serviceId    ?? service.id      ?? group.serviceId ?? '',
    planName:          sub.planName     ?? group.planName  ?? '',
    pricePerSeat:      sub.pricePerSeat ?? group.monthlyFee ?? 0,
    hostName: sub.hostName          ?? host.name          ?? '',
    hostAvatarInitial: sub.hostAvatarInitial ?? host.avatarInitial ?? '',
    hostAvatarColor:   sub.hostAvatarColor   ?? host.avatarColor   ?? '#64718A',
    hostPresenceStatus: sub.hostPresenceStatus ?? host.presenceStatus ?? 'offline',
    createdAt,
    joinedAt:          sub.joinedAt ?? createdAt,
  };
}
