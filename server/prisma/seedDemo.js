/**
 * 建立 demo 資料，涵蓋所有群組狀態、申請狀態、PM幣交易、通知、對話等，方便手動測試全部功能。
 * 完全自給自足，不依賴任何外部既有帳號。重複執行前請先清空資料庫（見 docs/testing/test-accounts.md）。
 * 執行：cd server && node prisma/seedDemo.js
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../src/lib/prisma.js'
import { AVATAR_COLORS } from '../src/utils/avatarColor.js'
import { SERVICES } from '../../src/shared/data/serviceCatalog.js'

const DEMO_PASSWORD = 'Demo1234'

function avatarColor(i) { return AVATAR_COLORS[i % AVATAR_COLORS.length] }

const DAY = 24 * 60 * 60 * 1000
const daysAgo = n => new Date(Date.now() - n * DAY)
const daysFromNow = n => new Date(Date.now() + n * DAY)

// 後端服務目錄（server/prisma/seed.js）目前沒有帶 tags，直接向前端 serviceCatalog.js
// 查詢該服務／方案實際的 tags + 分類，讓 demo 群組在探索頁顯示正確的標籤 chip
function lookupTags(serviceId, planName) {
  const service = SERVICES.find(s => s.id === serviceId)
  if (!service) return []
  const plan = service.plans.find(p => p.name === planName) ?? service.plans[0]
  return [...new Set([...(plan?.tags ?? []), service.category].filter(Boolean))]
}

function perSeat(plan, seats, cycle = 'monthly') {
  const monthly = cycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice / 12 : plan.monthlyFee
  return Math.ceil(monthly / seats)
}

async function upsertDemoUser({ email, name, phone, creditScore, tokenBalance, avatarIndex, isAdmin = false }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  // 信用分數上限 100、下限 0，避免種子資料手誤寫出界外值
  const clampedCreditScore = Math.max(0, Math.min(100, creditScore))
  return prisma.user.upsert({
    where: { email },
    update: { creditScore: clampedCreditScore, tokenBalance, isAdmin },
    create: {
      email, passwordHash, name, phone, creditScore: clampedCreditScore, tokenBalance, isAdmin,
      avatarInitial: name[0], avatarColor: avatarColor(avatarIndex),
    },
  })
}

async function topup(userId, amount, note) {
  await prisma.tokenTransaction.create({ data: { userId, type: 'topup', amount, note } })
}

async function createGroup({ hostId, service, planId, totalSeats, currentMembers, status, extra = {} }) {
  const plan = service.plans.find(p => p.id === planId)
  const monthlyFee = perSeat(plan, totalSeats, extra.billingCycle ?? 'monthly')
  return prisma.group.create({
    data: {
      hostId,
      serviceId: service.id,
      planId,
      planName: plan.name,
      maxMembers: totalSeats,
      currentMembers,
      monthlyFee,
      status,
      billingCycle: 'monthly',
      rules: '請準時繳費，勿分享帳號給非成員使用',
      tags: lookupTags(service.id, plan.name),
      ...extra,
    },
  })
}

async function addApplication({ groupId, userId, status, message, createdAt }) {
  return prisma.application.create({ data: { groupId, userId, status, message, createdAt: createdAt ?? daysAgo(3) } })
}

async function addMemberAndSubscription({ groupId, userId, seatCost, subStatus = 'pending', serviceInfo = null, extra = {}, subExtra = {} }) {
  await prisma.member.create({ data: { groupId, userId, serviceInfo, ...extra } })
  await prisma.subscription.create({ data: { groupId, userId, status: subStatus, ...subExtra } })
  await prisma.user.update({ where: { id: userId }, data: { tokenBalance: { decrement: seatCost } } })
  await prisma.group.update({ where: { id: groupId }, data: { escrowTokens: { increment: seatCost } } })
  await prisma.tokenTransaction.create({
    data: { userId, type: 'escrow', amount: -seatCost, relatedGroupId: groupId, note: `加入群組代管 ${seatCost} PM` },
  })
}

async function notify({ userId, groupId, type, title, message, meta, isRead = false, isPublic = false, createdAt }) {
  return prisma.notification.create({
    data: { userId, groupId, type, title, message, meta, isRead, isPublic, createdAt: createdAt ?? daysAgo(1) },
  })
}

async function createGroupConversation({ groupId, participantIds, messages }) {
  const conv = await prisma.conversation.create({
    data: { type: 'group', groupId, participants: participantIds, unreadCounts: {}, lastReadAt: {} },
  })
  let last = null
  for (const m of messages) {
    last = await prisma.message.create({
      data: { conversationId: conv.id, senderId: m.senderId, content: m.content, type: m.type ?? 'text', createdAt: m.createdAt },
    })
  }
  if (last) {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessage: { content: last.content, senderId: last.senderId, createdAt: last.createdAt.toISOString() } },
    })
  }
  return conv
}

async function main() {
  console.log('開始建立 demo 資料...\n')

  // ── 使用者 ────────────────────────────────────────────────────────────
  // 全部是自給自足的 demo 帳號，密碼皆為 Demo1234，不依賴任何外部既有帳號：
  //   demo7~demo9：主要團主帳號（各自持有多個群組，模擬不同團主風格）
  //   demo1~demo6：一般成員帳號（信用分數與PM幣餘額刻意分散，涵蓋高/中/低各種情境）
  //   demo-admin：專用管理員帳號（isAdmin: true），不參與一般群組，只用來測試申訴裁定
  const H1 = await upsertDemoUser({ email: 'demo7@partymatch.test', name: '吳志豪', phone: '0911000007', creditScore: 100, tokenBalance: 5000, avatarIndex: 0 })
  const H2 = await upsertDemoUser({ email: 'demo8@partymatch.test', name: '許雅涵', phone: '0911000008', creditScore: 92,  tokenBalance: 4000, avatarIndex: 1 })
  const H3 = await upsertDemoUser({ email: 'demo9@partymatch.test', name: '劉建成', phone: '0911000009', creditScore: 100, tokenBalance: 3000, avatarIndex: 2 })
  for (const [u, amt] of [[H1, 5000], [H2, 4000], [H3, 3000]]) {
    await topup(u.id, amt, `儲值 ${amt} PM`)
  }
  console.log('已建立 3 個團主帳號（demo7～demo9）')

  const D1 = await upsertDemoUser({ email: 'demo1@partymatch.test', name: '王小明', phone: '0911000001', creditScore: 100, tokenBalance: 2000, avatarIndex: 3 })
  const D2 = await upsertDemoUser({ email: 'demo2@partymatch.test', name: '林小美', phone: '0911000002', creditScore: 88,  tokenBalance: 1500, avatarIndex: 4 })
  const D3 = await upsertDemoUser({ email: 'demo3@partymatch.test', name: '陳大文', phone: '0911000003', creditScore: 72,  tokenBalance: 500,  avatarIndex: 5 })
  const D4 = await upsertDemoUser({ email: 'demo4@partymatch.test', name: '張雅婷', phone: '0911000004', creditScore: 100, tokenBalance: 3000, avatarIndex: 0 })
  const D5 = await upsertDemoUser({ email: 'demo5@partymatch.test', name: '李冠宇', phone: '0911000005', creditScore: 95,  tokenBalance: 4000, avatarIndex: 1 })
  const D6 = await upsertDemoUser({ email: 'demo6@partymatch.test', name: '黃詩涵', phone: '0911000006', creditScore: 60,  tokenBalance: 200,  avatarIndex: 2 })
  for (const [u, amt] of [[D1, 2000], [D2, 1500], [D3, 500], [D4, 3000], [D5, 4000], [D6, 200]]) {
    await topup(u.id, amt, `儲值 ${amt} PM`)
  }
  console.log('已建立 6 個一般成員帳號（demo1～demo6）')

  const ADMIN = await upsertDemoUser({ email: 'demo-admin@partymatch.test', name: '平台管理員', phone: '0911000099', creditScore: 100, tokenBalance: 0, avatarIndex: 3, isAdmin: true })
  console.log('已建立 1 個管理員帳號（demo-admin，isAdmin: true，僅用於測試申訴裁定，不參與一般群組）')
  console.log('全部帳號密碼皆為: Demo1234\n')

  // ── 服務目錄 ──────────────────────────────────────────────────────────
  const serviceIds = [
    'netflix', 'notion', 'spotify', 'disney', 'hbo', 'chatgpt', 'expressvpn', 'google-one',
    'kkbox', 'discord', 'duolingo', 'canva', 'cursor', 'apple-music', 'friday-video',
  ]
  const services = Object.fromEntries((await prisma.service.findMany({ where: { id: { in: serviceIds } } })).map(s => [s.id, s]))
  for (const id of serviceIds) {
    if (!services[id]) throw new Error(`找不到服務 ${id}，請先執行 npm run db:seed`)
  }

  // ── G1 recruiting：demo7 主揪 Netflix，年繳方案，1 筆待審申請（涵蓋年繳的手動測試路徑）──
  const g1 = await createGroup({ hostId: H1.id, service: services.netflix, planId: 'netflix-std', totalSeats: 2, currentMembers: 0, status: 'recruiting', extra: { billingCycle: 'yearly' } })
  await addApplication({ groupId: g1.id, userId: D1.id, status: 'pending', message: '想加入！平常都用 Netflix 追劇，穩定準時繳費 🙏' })
  await notify({ userId: H1.id, groupId: g1.id, type: 'new_application', title: '收到新的加入申請', message: '王小明 申請加入你的 Netflix 群組', meta: { groupId: g1.id }, isRead: false, createdAt: daysAgo(0) })
  await notify({ userId: D1.id, groupId: g1.id, type: 'application_sent', title: '申請已送出', message: '已送出加入 Netflix 群組的申請，等待團主審核', meta: { groupId: g1.id }, isRead: true, createdAt: daysAgo(0) })

  // ── G2 recruiting：D4 主揪 Notion，1 核准 1 拒絕，demo7 收藏 ──────────────
  const g2 = await createGroup({ hostId: D4.id, service: services.notion, planId: 'notion-business-monthly', totalSeats: 3, currentMembers: 1, status: 'recruiting' })
  await addApplication({ groupId: g2.id, userId: D5.id, status: 'approved' })
  await addMemberAndSubscription({ groupId: g2.id, userId: D5.id, seatCost: g2.monthlyFee })
  const g2Rejected = await addApplication({ groupId: g2.id, userId: D6.id, status: 'rejected', message: '可以加入嗎？' })
  await notify({ userId: D6.id, groupId: g2.id, type: 'application_rejected', title: '申請未通過', message: '很抱歉，你申請加入的 Notion 群組審核未通過', meta: { groupId: g2.id, applicationId: g2Rejected.id }, isRead: false })
  await prisma.favorite.create({ data: { userId: H1.id, groupId: g2.id } })

  // ── G3 full：demo8 主揪 Spotify，5 位核准（滿）＋ 1 筆撤回 ────────────────
  const g3 = await createGroup({ hostId: H2.id, service: services.spotify, planId: 'spotify-family', totalSeats: 6, currentMembers: 5, status: 'full' })
  for (const u of [D1, D2, D3, D5, D6]) {
    await addApplication({ groupId: g3.id, userId: u.id, status: 'approved' })
    await addMemberAndSubscription({ groupId: g3.id, userId: u.id, seatCost: g3.monthlyFee })
  }
  await addApplication({ groupId: g3.id, userId: D4.id, status: 'withdrawn', message: '手滑申請到了，抱歉' })
  await notify({ userId: H2.id, groupId: g3.id, type: 'group_full', title: '群組名額已滿', message: 'Spotify 群組名額已滿，記得鎖定群組並通知成員填寫帳號資訊', meta: { groupId: g3.id }, isRead: false })

  // ── G4 pending_confirmation：demo7 主揪 Disney+，已鎖定，成員尚未填帳號（sharingMethod: shared_credentials）───
  const g4 = await createGroup({
    hostId: H1.id, service: services.disney, planId: 'disney-std-monthly', totalSeats: 2, currentMembers: 1, status: 'pending_confirmation',
    extra: { nextBillingDate: daysFromNow(27), serviceInfoDeadline: daysFromNow(1) },
  })
  await addApplication({ groupId: g4.id, userId: D2.id, status: 'approved' })
  await addMemberAndSubscription({ groupId: g4.id, userId: D2.id, seatCost: g4.monthlyFee })
  await notify({ userId: D2.id, groupId: g4.id, type: 'application_approved', title: '申請已核准', message: '你已通過 Disney+ 群組審核，請前往填寫服務帳號資訊', meta: { groupId: g4.id }, isRead: false })

  // ── G5 pending_activation：demo9 主揪 HBO Max，成員已填完帳號，待啟用 ─────
  const g5 = await createGroup({
    hostId: H3.id, service: services.hbo, planId: 'hbo-std-monthly', totalSeats: 3, currentMembers: 2, status: 'pending_activation',
    extra: { nextBillingDate: daysFromNow(25) },
  })
  for (const u of [D3, D5]) {
    await addApplication({ groupId: g5.id, userId: u.id, status: 'approved' })
    await addMemberAndSubscription({
      groupId: g5.id, userId: u.id, seatCost: g5.monthlyFee,
      serviceInfo: { acknowledged: true },
    })
  }
  await notify({ userId: H3.id, groupId: g5.id, type: 'system', title: '全員已完成填寫', message: '所有成員都已完成服務帳號填寫，可以啟用服務囉', meta: { groupId: g5.id }, isRead: false })

  // ── G6 confirming：demo8 主揪 ChatGPT Team，demo7 為成員，48h 確認期中 ──────
  const g6 = await createGroup({
    hostId: H2.id, service: services.chatgpt, planId: 'chatgpt-team-monthly', totalSeats: 2, currentMembers: 1, status: 'confirming',
    extra: { nextBillingDate: daysFromNow(20), confirmDeadline: daysFromNow(1.5), escrowTokens: 0 },
  })
  await addApplication({ groupId: g6.id, userId: H1.id, status: 'approved' })
  await addMemberAndSubscription({
    groupId: g6.id, userId: H1.id, seatCost: g6.monthlyFee,
    serviceInfo: { email: H1.email },
    subStatus: 'active', subExtra: { nextBillingDate: daysFromNow(20) },
  })
  await notify({ userId: H1.id, groupId: g6.id, type: 'group_activated', title: '服務已啟用', message: 'ChatGPT Team 服務已啟用，48 小時內確認服務正常即可提前結束等待', meta: { groupId: g6.id, openBilling: true }, isRead: false })

  // ── G7 disputed：demo9 主揪 ExpressVPN，一位成員申訴中 ────────────────────
  const g7 = await createGroup({
    hostId: H3.id, service: services.expressvpn, planId: 'expressvpn-monthly', totalSeats: 4, currentMembers: 3, status: 'disputed',
    extra: { nextBillingDate: daysFromNow(15), disputeDeadline: daysFromNow(2), escrowTokens: 0 },
  })
  for (const u of [D1, D2, D6]) {
    await addApplication({ groupId: g7.id, userId: u.id, status: 'approved' })
    await addMemberAndSubscription({
      groupId: g7.id, userId: u.id, seatCost: g7.monthlyFee,
      serviceInfo: { acknowledged: true },
      subStatus: 'active',
      extra: u.id === D6.id ? { disputeEvidenceUrl: 'https://picsum.photos/seed/dispute1/600/400' } : {},
    })
  }
  await notify({ userId: H3.id, groupId: g7.id, type: 'dispute_raised', title: '收到成員申訴', message: '黃詩涵 針對 ExpressVPN 服務提出申訴，平台客服將於 3 天內裁定', meta: { groupId: g7.id }, isRead: false })
  await notify({ userId: D6.id, groupId: g7.id, type: 'system', title: '申訴已受理', message: '你的申訴已送出，平台客服將於 3 天內裁定，代管款項已凍結', meta: { groupId: g7.id }, isRead: true })

  // ── G8 active：demo7 主揪 Google One，3 位成員穩定運作中 ──────────────────
  const g8 = await createGroup({
    hostId: H1.id, service: services['google-one'], planId: 'google-one-ai-plus-monthly', totalSeats: 5, currentMembers: 3, status: 'active',
    extra: { nextBillingDate: daysFromNow(18) },
  })
  for (const u of [D2, D4, D5]) {
    await addApplication({ groupId: g8.id, userId: u.id, status: 'approved', createdAt: daysAgo(40) })
    await addMemberAndSubscription({
      groupId: g8.id, userId: u.id, seatCost: g8.monthlyFee,
      serviceInfo: { googleEmail: u.email },
      subStatus: 'active', subExtra: { lastPaidAt: daysAgo(12), nextBillingDate: daysFromNow(18) },
    })
  }
  await prisma.group.update({ where: { id: g8.id }, data: { escrowTokens: 0 } }) // 已進入 active，代管款項早已撥給團主
  await notify({ userId: H1.id, groupId: g8.id, type: 'escrow_released', title: '代管款項已撥款', message: 'Google One 群組確認期結束，代管款項已撥入你的PM幣餘額', meta: { groupId: g8.id }, isRead: true, createdAt: daysAgo(12) })

  // ── G9 active：demo8 主揪 KKBOX，demo7 為成員，另一位成員已退出 ──────────────
  const g9 = await createGroup({
    hostId: H2.id, service: services.kkbox, planId: 'kkbox-6', totalSeats: 6, currentMembers: 3, status: 'active',
    extra: { nextBillingDate: daysFromNow(9) },
  })
  for (const u of [H1, D3, D1]) {
    await addApplication({ groupId: g9.id, userId: u.id, status: 'approved', createdAt: daysAgo(60) })
    await addMemberAndSubscription({
      groupId: g9.id, userId: u.id, seatCost: g9.monthlyFee,
      serviceInfo: { email: u.email, address: '台北市信義區松仁路 100 號' },
      subStatus: 'active', subExtra: { lastPaidAt: daysAgo(21), nextBillingDate: daysFromNow(9) },
    })
  }
  const g9LeftApp = await addApplication({ groupId: g9.id, userId: D6.id, status: 'left', createdAt: daysAgo(50) })
  await prisma.user.update({ where: { id: D6.id }, data: { tokenBalance: { decrement: g9.monthlyFee } } })
  await prisma.tokenTransaction.create({ data: { userId: D6.id, type: 'escrow', amount: -g9.monthlyFee, relatedGroupId: g9.id, note: `加入群組代管 ${g9.monthlyFee} PM`, createdAt: daysAgo(55) } })
  await prisma.user.update({ where: { id: D6.id }, data: { tokenBalance: { increment: g9.monthlyFee } } })
  await prisma.tokenTransaction.create({ data: { userId: D6.id, type: 'refund', amount: g9.monthlyFee, relatedGroupId: g9.id, note: '退出群組退還代管款項', createdAt: daysAgo(50) } })
  await notify({ userId: H2.id, groupId: g9.id, type: 'member_left', title: '成員已退出群組', message: '黃詩涵 已退出 KKBOX 群組', meta: { groupId: g9.id, applicationId: g9LeftApp.id }, isRead: true, createdAt: daysAgo(50) })
  await prisma.group.update({ where: { id: g9.id }, data: { escrowTokens: 0 } }) // 已進入 active，代管款項早已撥給團主

  // ── G10 cancelled：demo9 主揪 Discord，鎖定前解散、全額退款 ───────────────
  const g10 = await createGroup({ hostId: H3.id, service: services.discord, planId: 'discord-family-monthly', totalSeats: 5, currentMembers: 0, status: 'cancelled' })
  for (const u of [D4, D5]) {
    await addApplication({ groupId: g10.id, userId: u.id, status: 'approved', createdAt: daysAgo(10) })
    await prisma.user.update({ where: { id: u.id }, data: { tokenBalance: { decrement: g10.monthlyFee } } })
    await prisma.tokenTransaction.create({ data: { userId: u.id, type: 'escrow', amount: -g10.monthlyFee, relatedGroupId: g10.id, note: `加入群組代管 ${g10.monthlyFee} PM`, createdAt: daysAgo(10) } })
    await prisma.user.update({ where: { id: u.id }, data: { tokenBalance: { increment: g10.monthlyFee } } })
    await prisma.tokenTransaction.create({ data: { userId: u.id, type: 'refund', amount: g10.monthlyFee, relatedGroupId: g10.id, note: '群組解散退還代管款項', createdAt: daysAgo(9) } })
    await notify({ userId: u.id, groupId: g10.id, type: 'group_ended', title: '群組已解散', message: 'Discord 群組已由團主解散，代管款項已全額退還', meta: { groupId: g10.id }, isRead: true, createdAt: daysAgo(9) })
  }

  // ── G11 ended：demo8 主揪 Duolingo，完整跑完一輪＋一位成員中途被移除 ──────
  const g11 = await createGroup({ hostId: H2.id, service: services.duolingo, planId: 'duolingo-family', totalSeats: 6, currentMembers: 2, status: 'ended' })
  for (const u of [D1, D3]) {
    await addApplication({ groupId: g11.id, userId: u.id, status: 'approved', createdAt: daysAgo(90) })
    await addMemberAndSubscription({
      groupId: g11.id, userId: u.id, seatCost: g11.monthlyFee,
      serviceInfo: { email: u.email },
      subStatus: 'ended', subExtra: { lastPaidAt: daysAgo(35) },
    })
  }
  const g11RemovedApp = await addApplication({ groupId: g11.id, userId: D2.id, status: 'removed', createdAt: daysAgo(85) })
  await prisma.user.update({ where: { id: D2.id }, data: { creditScore: { decrement: 15 } } })
  await notify({ userId: D2.id, groupId: g11.id, type: 'member_removed', title: '已被移出群組', message: '你已被移出 Duolingo 群組（長期未繳費），信用分數已扣分', meta: { groupId: g11.id, applicationId: g11RemovedApp.id }, isRead: true, createdAt: daysAgo(85) })
  await prisma.group.update({ where: { id: g11.id }, data: { escrowTokens: 0 } }) // 已結束，代管款項早已撥給團主

  // ── G12 recruiting：D6 主揪 Canva，設信用分數門檻，測試篩選 ────────────
  await createGroup({ hostId: D6.id, service: services.canva, planId: 'canva-team-monthly', totalSeats: 5, currentMembers: 0, status: 'recruiting', extra: { minCreditScore: 70 } })

  // ── G13 confirming：D4 主揪 Cursor，demo7 與 D5 皆未確認（測試「確認後尚有人未確認」的評價提示分支）
  const g13 = await createGroup({
    hostId: D4.id, service: services.cursor, planId: 'cursor-business-monthly', totalSeats: 3, currentMembers: 2, status: 'confirming',
    extra: { nextBillingDate: daysFromNow(28), confirmDeadline: daysFromNow(1), escrowTokens: 0 },
  })
  for (const u of [H1, D5]) {
    await addApplication({ groupId: g13.id, userId: u.id, status: 'approved' })
    await addMemberAndSubscription({
      groupId: g13.id, userId: u.id, seatCost: g13.monthlyFee,
      serviceInfo: { email: u.email },
      subStatus: 'active', subExtra: { nextBillingDate: daysFromNow(28) },
    })
  }
  await createGroupConversation({
    groupId: g13.id,
    participantIds: [D4.id, H1.id, D5.id],
    messages: [
      { senderId: D4.id, content: '服務已經啟用囉，麻煩大家 48 小時內確認一下', createdAt: daysAgo(0.2) },
    ],
  })
  await notify({ userId: H1.id, groupId: g13.id, type: 'group_activated', title: '服務已啟用', message: 'Cursor Business 服務已啟用，48 小時內確認服務正常即可提前結束等待', meta: { groupId: g13.id, openBilling: true }, isRead: false })

  // ── G14 pending_confirmation：demo9 主揪 Apple Music（sharingMethod: apple_family），成員尚未填 Apple ID ──
  const g14 = await createGroup({
    hostId: H3.id, service: services['apple-music'], planId: 'apple-music-family-monthly', totalSeats: 3, currentMembers: 2, status: 'pending_confirmation',
    extra: { nextBillingDate: daysFromNow(30), serviceInfoDeadline: daysFromNow(1) },
  })
  await addApplication({ groupId: g14.id, userId: D1.id, status: 'approved' })
  await addMemberAndSubscription({ groupId: g14.id, userId: D1.id, seatCost: g14.monthlyFee, serviceInfo: { appleId: D1.email } })
  await addApplication({ groupId: g14.id, userId: D2.id, status: 'approved' })
  await addMemberAndSubscription({ groupId: g14.id, userId: D2.id, seatCost: g14.monthlyFee })

  // ── G15 pending_confirmation：demo7 主揪 Google One（sharingMethod: google_family），成員尚未填 Google 帳戶 ──
  const g15 = await createGroup({
    hostId: H1.id, service: services['google-one'], planId: 'google-one-100-monthly', totalSeats: 2, currentMembers: 1, status: 'pending_confirmation',
    extra: { nextBillingDate: daysFromNow(30), serviceInfoDeadline: daysFromNow(1) },
  })
  await addApplication({ groupId: g15.id, userId: D3.id, status: 'approved' })
  await addMemberAndSubscription({ groupId: g15.id, userId: D3.id, seatCost: g15.monthlyFee })

  // ── G16 pending_confirmation：demo8 主揪 friDay影音（sharingMethod: invite_code），成員尚未產生邀請碼 ──
  const g16 = await createGroup({
    hostId: H2.id, service: services['friday-video'], planId: 'friday-video-plan', totalSeats: 2, currentMembers: 1, status: 'pending_confirmation',
    extra: { nextBillingDate: daysFromNow(30), serviceInfoDeadline: daysFromNow(1) },
  })
  await addApplication({ groupId: g16.id, userId: D5.id, status: 'approved' })
  await addMemberAndSubscription({ groupId: g16.id, userId: D5.id, seatCost: g16.monthlyFee })

  // ── 系統公告 ──────────────────────────────────────────────────────────
  await notify({ userId: null, type: 'system', title: '平台維護公告', message: 'PartyMatch 將於本週六凌晨 2:00-4:00 進行例行維護，期間服務可能短暫中斷', isPublic: true, isRead: false, createdAt: daysAgo(2) })

  // ── 對話：每個已鎖定群組在真實流程中都會於鎖定當下自動建立聊天室，
  //         這裡的 demo 資料是直接寫入 DB、跳過該流程，所以要手動補上 ──────
  await createGroupConversation({
    groupId: g4.id,
    participantIds: [H1.id, D2.id],
    messages: [
      { senderId: H1.id, content: '群組已經鎖定囉，麻煩填一下服務帳號資訊', createdAt: daysAgo(2) },
      { senderId: D2.id, content: '好的，我這幾天會填', createdAt: daysAgo(2) },
    ],
  })
  await createGroupConversation({
    groupId: g5.id,
    participantIds: [H3.id, D3.id, D5.id],
    messages: [
      { senderId: D3.id, content: '帳號資訊都填好了', createdAt: daysAgo(1) },
      { senderId: H3.id, content: '收到，我這邊確認後就啟用服務', createdAt: daysAgo(1) },
    ],
  })
  await createGroupConversation({
    groupId: g6.id,
    participantIds: [H2.id, H1.id],
    messages: [
      { senderId: H2.id, content: '服務已經啟用囉，記得 48 小時內確認一下狀態', createdAt: daysAgo(0.5) },
    ],
  })
  await createGroupConversation({
    groupId: g7.id,
    participantIds: [H3.id, D1.id, D2.id, D6.id],
    messages: [
      { senderId: D6.id, content: '帳號一直登入不進去，可以幫忙看一下嗎？', createdAt: daysAgo(3) },
      { senderId: H3.id, content: '我確認一下，應該是密碼被改到了', createdAt: daysAgo(3) },
      { senderId: D6.id, content: '等太久了，我已經向平台申訴', createdAt: daysAgo(2) },
    ],
  })
  await createGroupConversation({
    groupId: g9.id,
    participantIds: [H2.id, H1.id, D3.id, D1.id],
    messages: [
      { senderId: H2.id, content: '大家的帳號都設定好了，開始用吧！', createdAt: daysAgo(60) },
      { senderId: H1.id, content: '謝謝團主～', createdAt: daysAgo(59) },
    ],
  })
  await createGroupConversation({
    groupId: g11.id,
    participantIds: [H2.id, D1.id, D3.id],
    messages: [
      { senderId: H2.id, content: '這期服務即將到期，之後不續訂了，謝謝大家一起共享', createdAt: daysAgo(31) },
      { senderId: D1.id, content: '謝謝團主這段時間的照顧！', createdAt: daysAgo(31) },
    ],
  })

  await createGroupConversation({
    groupId: g8.id,
    participantIds: [H1.id, D2.id, D4.id, D5.id],
    messages: [
      { senderId: H1.id, content: '大家好，服務已經啟用囉，帳號資訊我用聊天室傳給大家', createdAt: daysAgo(20) },
      { senderId: D2.id, content: '收到，謝謝團主！', createdAt: daysAgo(20) },
      { senderId: D4.id, content: '請問下次扣款是什麼時候呢？', createdAt: daysAgo(5) },
      { senderId: H1.id, content: '18 天後喔，到時候我會再提醒大家', createdAt: daysAgo(5) },
    ],
  })

  const dm = await prisma.conversation.create({
    data: { type: 'dm', participants: [H1.id, H2.id], initiatorId: H1.id, unreadCounts: { [H2.id]: 1 }, lastReadAt: {} },
  })
  await prisma.message.create({ data: { conversationId: dm.id, senderId: H1.id, content: '嗨，想請問 Spotify 群組還有名額嗎？', createdAt: daysAgo(1) } })
  const dmLastMessage = '目前剛好滿囉，不好意思！之後有名額會再通知你'
  await prisma.message.create({ data: { conversationId: dm.id, senderId: H2.id, content: dmLastMessage, createdAt: daysAgo(0.5) } })
  await prisma.conversation.update({
    where: { id: dm.id },
    data: { lastMessage: { content: dmLastMessage, senderId: H2.id, createdAt: daysAgo(0.5).toISOString() } },
  })

  // ── 付款方式 ──────────────────────────────────────────────────────────
  await prisma.paymentMethod.createMany({
    data: [
      { userId: H1.id, brand: 'Visa', last4: '4242', expiry: '12/28', isDefault: true },
      { userId: H1.id, brand: 'Mastercard', last4: '5588', expiry: '06/27', isDefault: false },
      { userId: D1.id, brand: 'Visa', last4: '1234', expiry: '09/26', isDefault: true },
    ],
  })

  console.log('\ndemo 資料建立完成！')
  console.log('共 10 個帳號，密碼皆為: Demo1234')
  console.log('  demo7～demo9：團主帳號')
  console.log('  demo1～demo6：一般成員帳號')
  console.log('  demo-admin：管理員帳號（僅用於申訴裁定）')
}

main()
  .catch(err => { console.error('建立 demo 資料失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
