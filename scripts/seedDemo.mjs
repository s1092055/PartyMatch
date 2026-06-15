/**
 * Seed Firestore with demo data (all records tagged _demo: true).
 *
 * Usage:
 *   node scripts/seedDemo.mjs
 *
 * Reads credentials from .env. Creates (or reuses) a demo Firebase Auth
 * account, then writes demo groups, members, applications, subscriptions,
 * notifications, and favorites.
 *
 * Run `node scripts/clearDemo.mjs` to remove all demo data.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getUsdToTwd, twd } from './utils/getRate.mjs'

// ── Load .env ──────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
readFileSync(resolve(__dir, '../.env'), 'utf8')
  .split('\n')
  .forEach(line => {
    const eq = line.indexOf('=')
    if (eq === -1 || line.trimStart().startsWith('#')) return
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    process.env[key] = val
  })

// ── Firebase ───────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc, collection, setDoc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseApp = initializeApp({
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
})
const db   = getFirestore(firebaseApp)
const auth = getAuth(firebaseApp)

const DEMO_EMAIL    = process.env.DEMO_USER_EMAIL    || 'demo@partymatch.tw'
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'demo1234'

// ── Get / create demo user ─────────────────────────────────────────
async function getDemoUid() {
  let uid
  try {
    const result = await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD)
    uid = result.user.uid
    console.log('  ✓ demo user signed in:', DEMO_EMAIL)
  } catch (e) {
    if (!['auth/user-not-found', 'auth/invalid-credential'].includes(e.code)) throw e
    const result = await createUserWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD)
    uid = result.user.uid
    console.log('  ✓ demo user created:', DEMO_EMAIL)
  }

  await setDoc(doc(db, 'users', uid), {
    name:        '林宥廷',
    email:       DEMO_EMAIL,
    avatarColor: '#0866F2',
    joinedAt:    '2025-01-15',
    role:        'user',
    creditScore: 92,
    isVerified:  true,
  })
  return uid
}

// ── Demo data builder ──────────────────────────────────────────────
function buildDemoData(uid, rate) {
  const D = true // _demo flag

  // Fake hosts (no real Firebase Auth needed — just display data)
  const hosts = {
    h1: { id: 'demo_fake_host_01', name: '陳建宏', initial: '陳', color: '#F97316', rating: 92, reviews: 15, verified: true },
    h2: { id: 'demo_fake_host_02', name: '王小美', initial: '王', color: '#14B8A6', rating: 85, reviews: 8,  verified: false },
    h3: { id: 'demo_fake_host_03', name: '林志明', initial: '林', color: '#8B5CF6', rating: 95, reviews: 23, verified: true },
    h4: { id: 'demo_fake_host_04', name: '張雅婷', initial: '張', color: '#EF4444', rating: 88, reviews: 5,  verified: false },
  }

  // Fake member profiles
  const fakeMembers = [
    { id: 'demo_fake_mem_01', name: '張明志', initial: '張', color: '#F97316' },
    { id: 'demo_fake_mem_02', name: '李雅琪', initial: '李', color: '#14B8A6' },
    { id: 'demo_fake_mem_03', name: '王大偉', initial: '王', color: '#8B5CF6' },
    { id: 'demo_fake_mem_04', name: '劉詩涵', initial: '劉', color: '#EF4444' },
    { id: 'demo_fake_mem_05', name: '吳俊霖', initial: '吳', color: '#10B26C' },
    { id: 'demo_fake_mem_06', name: '蔡佳蓉', initial: '蔡', color: '#F59A0B' },
    { id: 'demo_fake_mem_07', name: '黃建民', initial: '黃', color: '#0866F2' },
  ]
  const [m1, m2, m3, m4, m5, m6, m7] = fakeMembers

  function hostFields(h) {
    return {
      hostId:            h.id,
      hostName:          h.name,
      hostAvatarInitial: h.initial,
      hostAvatarColor:   h.color,
      hostRating:        h.rating,
      hostReviewCount:   h.reviews,
    }
  }

  // Demo user as host fields
  const demoHost = {
    hostId:            uid,
    hostName:          '林宥廷',
    hostAvatarInitial: '林',
    hostAvatarColor:   '#0866F2',
    hostRating:        92,
    hostReviewCount:   7,
  }

  // ── Groups ────────────────────────────────────────────────────────
  const groups = [
    // ─ Demo user as HOST ────────────────────────────────────────────
    {
      id: 'demo_group_spotify_01',
      ...demoHost,
      serviceId:       'spotify',
      serviceName:     'Spotify Premium',
      planName:        '個人方案（Family）',
      pricePerSeat:    twd(31.88, rate, { perYear: true }),  // GoingBus: $31.88/yr per person
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-15',
      totalSeats:      6,
      usedSeats:       3,
      openSeats:       3,
      joinMode:        'approval',
      status:          'recruiting',
      tags:            ['音樂', '需要審核'],
      rules:           ['請準時繳費，每月 15 日前完成付款', '不分享帳號密碼給第三方', '加入前請確認已閱讀規則'],
      requirements:    '需提供真實聯絡方式，準時繳費者優先。',
      createdAt:       '2026-04-01',
      updatedAt:       '2026-05-10',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_netflix_01',
      ...demoHost,
      serviceId:       'netflix',
      serviceName:     'Netflix',
      planName:        '高級（4K）',
      pricePerSeat:    twd(5.92, rate),                       // GoingBus: $5.92/mo per person
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-20',
      totalSeats:      4,
      usedSeats:       4,
      openSeats:       0,
      joinMode:        'approval',
      status:          'pending_confirmation',
      tags:            ['影音', '4K HDR', '4人共享'],
      rules:           ['每月 20 日前完成付款', '不得更改帳號密碼'],
      requirements:    null,
      createdAt:       '2026-03-15',
      updatedAt:       '2026-05-18',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_youtube_01',
      ...demoHost,
      serviceId:       'youtube',
      serviceName:     'YouTube Premium',
      planName:        '家庭方案',
      pricePerSeat:    twd(49.99, rate, { perYear: true }),   // GoingBus: $49.99/yr per person
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-07',
      totalSeats:      6,
      usedSeats:       5,
      openSeats:       1,
      joinMode:        'approval',
      status:          'active',
      tags:            ['影音', '家庭方案', '需要審核'],
      rules:           ['每月 7 日前付款', '家庭帳號，各自使用個人檔案'],
      requirements:    null,
      createdAt:       '2026-01-10',
      updatedAt:       '2026-05-05',
      reviews:         [],
      _demo:           D,
    },

    // ─ Demo user as MEMBER ───────────────────────────────────────────
    {
      id: 'demo_group_chatgpt_01',
      ...hostFields(hosts.h1),
      serviceId:       'chatgpt',
      serviceName:     'ChatGPT Plus',
      planName:        'Plus',
      pricePerSeat:    twd(20.00, rate, { seats: 2 }),        // Official: $20/mo ÷ 2 people
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-18',
      totalSeats:      2,
      usedSeats:       2,
      openSeats:       0,
      joinMode:        'approval',
      status:          'active',
      tags:            ['AI工具', '需要審核'],
      rules:           ['獨立 API 帳號，互不干擾', '每月 18 日前付款'],
      requirements:    '需有 ChatGPT 使用需求，長期穩定合作優先。',
      createdAt:       '2026-02-01',
      updatedAt:       '2026-05-01',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_applemusic_01',
      ...hostFields(hosts.h2),
      serviceId:       'apple-music',
      serviceName:     'Apple Music',
      planName:        '家庭方案（6人）',
      pricePerSeat:    twd(6.99, rate, { seats: 6 }),         // Official: $6.99/mo family ÷ 6
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-10',
      totalSeats:      6,
      usedSeats:       3,
      openSeats:       3,
      joinMode:        'approval',
      status:          'recruiting',
      tags:            ['音樂', '家庭方案', '需要審核'],
      rules:           ['需使用 Apple 裝置', '每月 10 日前付款'],
      requirements:    '限 Apple 生態系用戶，需有 Apple ID。',
      createdAt:       '2026-04-20',
      updatedAt:       '2026-05-12',
      reviews:         [],
      _demo:           D,
    },

    // ─ Demo user as HOST (more status variety) ──────────────────────
    {
      id: 'demo_group_discord_01',
      ...demoHost,
      serviceId:       'discord',
      serviceName:     'Discord Nitro',
      planName:        '家庭方案',
      pricePerSeat:    twd(9.99, rate, { seats: 5 }),         // Official: $9.99/mo ÷ 5 people
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-03',
      totalSeats:      5,
      usedSeats:       3,
      openSeats:       0,
      joinMode:        'approval',
      status:          'paused',
      tags:            ['通訊', '家庭方案'],
      rules:           ['每月 3 日前付款', '不共享帳號'],
      requirements:    null,
      createdAt:       '2026-02-20',
      updatedAt:       '2026-05-01',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_notion_01',
      ...demoHost,
      serviceId:       'notion',
      serviceName:     'Notion Plus',
      planName:        'Plus',
      pricePerSeat:    twd(2.99, rate),                       // GoingBus: $2.99/mo per person
      billingCycle:    'monthly',
      nextBillingDate: '2026-04-15',
      totalSeats:      3,
      usedSeats:       2,
      openSeats:       0,
      joinMode:        'approval',
      status:          'ended',
      tags:            ['辦公', '筆記工具'],
      rules:           ['每月 15 日前付款', '各自管理個人 Workspace'],
      requirements:    null,
      createdAt:       '2025-10-01',
      updatedAt:       '2026-04-20',
      reviews:         [],
      _demo:           D,
    },

    // ─ Demo user as MEMBER (more subs variety) ───────────────────────
    {
      id: 'demo_group_disney_02',
      ...hostFields(hosts.h3),
      serviceId:       'disney',
      serviceName:     'Disney+',
      planName:        '標準',
      pricePerSeat:    twd(28.99, rate, { perYear: true }),   // GoingBus: $28.99/yr per person
      billingCycle:    'monthly',
      nextBillingDate: '2026-05-27',
      totalSeats:      4,
      usedSeats:       4,
      openSeats:       0,
      joinMode:        'approval',
      status:          'active',
      tags:            ['影音'],
      rules:           ['每月 27 日前付款', '不更改帳號設定'],
      requirements:    null,
      createdAt:       '2026-03-27',
      updatedAt:       '2026-05-15',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_hbo_01',
      ...hostFields(hosts.h1),
      serviceId:       'hbo',
      serviceName:     'HBO Max',
      planName:        '標準方案',
      pricePerSeat:    twd(28.99, rate, { perYear: true }),   // GoingBus: $28.99/yr per person
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-15',
      totalSeats:      3,
      usedSeats:       3,
      openSeats:       0,
      joinMode:        'approval',
      status:          'active',
      tags:            ['影音', '需要審核'],
      rules:           ['每月 15 日前付款', '不更改帳號密碼'],
      requirements:    null,
      createdAt:       '2026-01-20',
      updatedAt:       '2026-05-17',
      reviews:         [],
      _demo:           D,
    },

    // ─ Explore-only groups ───────────────────────────────────────────
    {
      id: 'demo_group_disney_01',
      ...hostFields(hosts.h3),
      serviceId:       'disney',
      serviceName:     'Disney+',
      planName:        '高級',
      pricePerSeat:    twd(35.99, rate, { perYear: true }),   // GoingBus premium est: $35.99/yr
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-12',
      totalSeats:      4,
      usedSeats:       2,
      openSeats:       2,
      joinMode:        'approval',
      status:          'recruiting',
      tags:            ['影音', '4K HDR'],
      rules:           ['每月 12 日前付款'],
      requirements:    null,
      createdAt:       '2026-04-05',
      updatedAt:       '2026-05-08',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_googleone_01',
      ...hostFields(hosts.h4),
      serviceId:       'google-one',
      serviceName:     'Google One',
      planName:        '2 TB',
      pricePerSeat:    twd(9.99, rate, { seats: 5 }),         // Official: $9.99/mo ÷ 5 members
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-25',
      totalSeats:      5,
      usedSeats:       2,
      openSeats:       3,
      joinMode:        'approval',
      status:          'recruiting',
      tags:            ['雲端', '需要審核', '2TB 空間'],
      rules:           ['各自獨立空間，不互相占用', '每月 25 日前付款'],
      requirements:    null,
      createdAt:       '2026-05-01',
      updatedAt:       '2026-05-15',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_ms365_01',
      ...hostFields(hosts.h1),
      serviceId:       'microsoft-365',
      serviceName:     'Microsoft 365',
      planName:        '家庭版（6人）',
      pricePerSeat:    twd(99.99, rate, { perYear: true, seats: 6 }), // Official: $99.99/yr ÷ 6
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-08',
      totalSeats:      6,
      usedSeats:       3,
      openSeats:       3,
      joinMode:        'approval',
      status:          'recruiting',
      tags:            ['辦公', '家庭方案'],
      rules:           ['OneDrive 獨立空間使用', '每月 8 日前付款'],
      requirements:    null,
      createdAt:       '2026-04-10',
      updatedAt:       '2026-05-10',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_claude_01',
      ...hostFields(hosts.h2),
      serviceId:       'claude',
      serviceName:     'Claude Pro',
      planName:        'Pro',
      pricePerSeat:    twd(20.00, rate, { seats: 2 }),        // Official: $20/mo ÷ 2 people
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-22',
      totalSeats:      2,
      usedSeats:       1,
      openSeats:       1,
      joinMode:        'approval',
      status:          'recruiting',
      tags:            ['AI工具', '獨立帳號', '月費制'],
      rules:           ['獨立帳號使用，不共享', '每月 22 日前付款'],
      requirements:    '有 AI 工作需求者優先，長期合作。',
      createdAt:       '2026-05-05',
      updatedAt:       '2026-05-16',
      reviews:         [],
      _demo:           D,
    },
    {
      id: 'demo_group_kkbox_01',
      ...hostFields(hosts.h3),
      serviceId:       'kkbox',
      serviceName:     'KKBOX',
      planName:        '家庭方案',
      pricePerSeat:    twd(9.90, rate, { seats: 5 }),         // Official: NT$320/mo ≈ $9.90 ÷ 5
      billingCycle:    'monthly',
      nextBillingDate: '2026-06-01',
      totalSeats:      5,
      usedSeats:       2,
      openSeats:       3,
      joinMode:        'approval',
      status:          'recruiting',
      tags:            ['音樂', '家庭方案'],
      rules:           ['每月 1 日前付款', '不分享帳號'],
      requirements:    null,
      createdAt:       '2026-04-28',
      updatedAt:       '2026-05-14',
      reviews:         [],
      _demo:           D,
    },
  ]

  // ── Members ───────────────────────────────────────────────────────
  const members = [
    // Spotify group members (hosted by demo user)
    { id: 'demo_mem_sp_01', groupId: 'demo_group_spotify_01', groupName: 'Spotify Premium', userId: m1.id, userName: m1.name, userAvatarInitial: m1.initial, userAvatarColor: m1.color, role: 'member', joinedAt: '2026-04-05', paymentStatus: 'confirmed', lastPaidAt: '2026-05-12', _demo: D },
    { id: 'demo_mem_sp_02', groupId: 'demo_group_spotify_01', groupName: 'Spotify Premium', userId: m2.id, userName: m2.name, userAvatarInitial: m2.initial, userAvatarColor: m2.color, role: 'member', joinedAt: '2026-04-10', paymentStatus: 'confirmed', lastPaidAt: '2026-05-11', _demo: D },

    // Netflix group members — all markedPaid (pending_confirmation status)
    { id: 'demo_mem_nf_01', groupId: 'demo_group_netflix_01', groupName: 'Netflix', userId: m3.id, userName: m3.name, userAvatarInitial: m3.initial, userAvatarColor: m3.color, role: 'member', joinedAt: '2026-03-20', paymentStatus: 'markedPaid', lastPaidAt: '2026-05-17', _demo: D },
    { id: 'demo_mem_nf_02', groupId: 'demo_group_netflix_01', groupName: 'Netflix', userId: m4.id, userName: m4.name, userAvatarInitial: m4.initial, userAvatarColor: m4.color, role: 'member', joinedAt: '2026-03-20', paymentStatus: 'markedPaid', lastPaidAt: '2026-05-16', _demo: D },
    { id: 'demo_mem_nf_03', groupId: 'demo_group_netflix_01', groupName: 'Netflix', userId: m5.id, userName: m5.name, userAvatarInitial: m5.initial, userAvatarColor: m5.color, role: 'member', joinedAt: '2026-03-22', paymentStatus: 'markedPaid', lastPaidAt: '2026-05-18', _demo: D },

    // YouTube group members
    { id: 'demo_mem_yt_01', groupId: 'demo_group_youtube_01', groupName: 'YouTube Premium', userId: m1.id, userName: m1.name, userAvatarInitial: m1.initial, userAvatarColor: m1.color, role: 'member', joinedAt: '2026-01-15', paymentStatus: 'confirmed', lastPaidAt: '2026-05-05', _demo: D },
    { id: 'demo_mem_yt_02', groupId: 'demo_group_youtube_01', groupName: 'YouTube Premium', userId: m6.id, userName: m6.name, userAvatarInitial: m6.initial, userAvatarColor: m6.color, role: 'member', joinedAt: '2026-01-15', paymentStatus: 'confirmed', lastPaidAt: '2026-05-06', _demo: D },
    { id: 'demo_mem_yt_03', groupId: 'demo_group_youtube_01', groupName: 'YouTube Premium', userId: m7.id, userName: m7.name, userAvatarInitial: m7.initial, userAvatarColor: m7.color, role: 'member', joinedAt: '2026-02-01', paymentStatus: 'confirmed', lastPaidAt: '2026-05-04', _demo: D },
    { id: 'demo_mem_yt_04', groupId: 'demo_group_youtube_01', groupName: 'YouTube Premium', userId: m2.id, userName: m2.name, userAvatarInitial: m2.initial, userAvatarColor: m2.color, role: 'member', joinedAt: '2026-02-10', paymentStatus: 'confirmed', lastPaidAt: '2026-05-07', _demo: D },

    // Demo user as member of ChatGPT group
    { id: 'demo_mem_cg_demo', groupId: 'demo_group_chatgpt_01', groupName: 'ChatGPT Plus', userId: uid, userName: '林宥廷', userAvatarInitial: '林', userAvatarColor: '#0866F2', role: 'member', joinedAt: '2026-02-05', paymentStatus: 'confirmed', lastPaidAt: '2026-05-16', _demo: D },

    // Discord group members (hosted by demo user)
    { id: 'demo_mem_dc_01', groupId: 'demo_group_discord_01', groupName: 'Discord Nitro', userId: m4.id, userName: m4.name, userAvatarInitial: m4.initial, userAvatarColor: m4.color, role: 'member', joinedAt: '2026-03-01', paymentStatus: 'confirmed', lastPaidAt: '2026-05-01', _demo: D },
    { id: 'demo_mem_dc_02', groupId: 'demo_group_discord_01', groupName: 'Discord Nitro', userId: m5.id, userName: m5.name, userAvatarInitial: m5.initial, userAvatarColor: m5.color, role: 'member', joinedAt: '2026-03-05', paymentStatus: 'confirmed', lastPaidAt: '2026-05-02', _demo: D },

    // Notion group members (hosted by demo user)
    { id: 'demo_mem_nt_01', groupId: 'demo_group_notion_01', groupName: 'Notion Plus', userId: m6.id, userName: m6.name, userAvatarInitial: m6.initial, userAvatarColor: m6.color, role: 'member', joinedAt: '2025-10-05', paymentStatus: 'confirmed', lastPaidAt: '2026-04-13', _demo: D },

    // Demo user as member of Disney+ group (upcoming billing)
    { id: 'demo_mem_dis_demo', groupId: 'demo_group_disney_02', groupName: 'Disney+', userId: uid, userName: '林宥廷', userAvatarInitial: '林', userAvatarColor: '#0866F2', role: 'member', joinedAt: '2026-03-27', paymentStatus: 'confirmed', lastPaidAt: '2026-04-25', _demo: D },

    // Demo user as member of HBO Max group (markedPaid)
    { id: 'demo_mem_hbo_demo', groupId: 'demo_group_hbo_01', groupName: 'HBO Max', userId: uid, userName: '林宥廷', userAvatarInitial: '林', userAvatarColor: '#0866F2', role: 'member', joinedAt: '2026-01-25', paymentStatus: 'markedPaid', lastPaidAt: '2026-05-17', _demo: D },
  ]

  // ── Applications ──────────────────────────────────────────────────
  const applications = [
    // Pending application to demo user's Spotify group
    { id: 'demo_app_sp_01', groupId: 'demo_group_spotify_01', groupName: 'Spotify Premium', serviceId: 'spotify', serviceName: 'Spotify Premium', planName: '個人方案（Family）', hostId: uid, hostName: '林宥廷', applicantId: 'demo_fake_app_user_01', applicantName: '江文彬', applicantAvatarInitial: '江', applicantAvatarColor: '#0F172A', applicantCreditScore: 88, userId: 'demo_fake_app_user_01', userName: '江文彬', userAvatarInitial: '江', userAvatarColor: '#0F172A', message: '你好，我平常很常聽音樂，願意準時繳費，希望能加入！', status: 'pending', createdAt: '2026-05-18', updatedAt: '2026-05-18', _demo: D },

    // Pending application to demo user's Spotify group (2nd applicant)
    { id: 'demo_app_sp_02', groupId: 'demo_group_spotify_01', groupName: 'Spotify Premium', serviceId: 'spotify', serviceName: 'Spotify Premium', planName: '個人方案（Family）', hostId: uid, hostName: '林宥廷', applicantId: 'demo_fake_app_user_02', applicantName: '蔡欣儀', applicantAvatarInitial: '蔡', applicantAvatarColor: '#14B8A6', applicantCreditScore: 75, userId: 'demo_fake_app_user_02', userName: '蔡欣儀', userAvatarInitial: '蔡', userAvatarColor: '#14B8A6', message: '我每天都在聽歌，很需要 Spotify Premium，保證準時繳費！', status: 'pending', createdAt: '2026-05-19', updatedAt: '2026-05-19', _demo: D },

    // Demo user applied to Apple Music group (pending)
    { id: 'demo_app_am_demo', groupId: 'demo_group_applemusic_01', groupName: 'Apple Music', serviceId: 'apple-music', serviceName: 'Apple Music', planName: '家庭方案（6人）', hostId: hosts.h2.id, hostName: hosts.h2.name, applicantId: uid, applicantName: '林宥廷', applicantAvatarInitial: '林', applicantAvatarColor: '#0866F2', applicantCreditScore: 92, userId: uid, userName: '林宥廷', userAvatarInitial: '林', userAvatarColor: '#0866F2', message: '我使用 Apple 裝置，願意準時繳費。', status: 'pending', createdAt: '2026-05-17', updatedAt: '2026-05-17', _demo: D },

    // Demo user's rejected application (for applications tab)
    { id: 'demo_app_ms_demo', groupId: 'demo_group_ms365_01', groupName: 'Microsoft 365', serviceId: 'microsoft-365', serviceName: 'Microsoft 365', planName: '家庭版（6人）', hostId: hosts.h1.id, hostName: hosts.h1.name, applicantId: uid, applicantName: '林宥廷', applicantAvatarInitial: '林', applicantAvatarColor: '#0866F2', applicantCreditScore: 92, userId: uid, userName: '林宥廷', userAvatarInitial: '林', userAvatarColor: '#0866F2', message: '需要 Office 工具，希望能加入共享！', status: 'rejected', createdAt: '2026-05-08', updatedAt: '2026-05-09', _demo: D },
  ]

  // ── Subscriptions ─────────────────────────────────────────────────
  const subscriptions = [
    // Demo user's subscription to ChatGPT group (active, confirmed)
    { id: 'demo_sub_cg_demo', userId: uid, groupId: 'demo_group_chatgpt_01', serviceId: 'chatgpt', serviceName: 'ChatGPT Plus', planName: 'Plus', hostName: hosts.h1.name, hostAvatarInitial: hosts.h1.initial, hostAvatarColor: hosts.h1.color, pricePerSeat: twd(20.00, rate, { seats: 2 }), billingCycle: 'monthly', nextBillingDate: '2026-06-18', joinedAt: '2026-02-05', paymentStatus: 'confirmed', status: 'active', createdAt: '2026-02-05', updatedAt: '2026-05-16', _demo: D },

    // Demo user's pending application to Apple Music (subscription pre-created for when approved)
    { id: 'demo_sub_am_demo', userId: uid, groupId: 'demo_group_applemusic_01', serviceId: 'apple-music', serviceName: 'Apple Music', planName: '家庭方案（6人）', hostName: hosts.h2.name, hostAvatarInitial: hosts.h2.initial, hostAvatarColor: hosts.h2.color, pricePerSeat: twd(6.99, rate, { seats: 6 }), billingCycle: 'monthly', nextBillingDate: '2026-06-10', joinedAt: '2026-05-17', paymentStatus: 'pending', status: 'pending_payment', createdAt: '2026-05-17', updatedAt: '2026-05-17', _demo: D },

    // Disney+ — upcoming billing (within 7 days), confirmed payment
    { id: 'demo_sub_dis_demo', userId: uid, groupId: 'demo_group_disney_02', serviceId: 'disney', serviceName: 'Disney+', planName: '標準', hostName: hosts.h3.name, hostAvatarInitial: hosts.h3.initial, hostAvatarColor: hosts.h3.color, pricePerSeat: twd(28.99, rate, { perYear: true }), billingCycle: 'monthly', nextBillingDate: '2026-05-27', joinedAt: '2026-03-27', paymentStatus: 'confirmed', status: 'active', createdAt: '2026-03-27', updatedAt: '2026-05-15', _demo: D },

    // HBO Max — markedPaid (waiting host confirmation)
    { id: 'demo_sub_hbo_demo', userId: uid, groupId: 'demo_group_hbo_01', serviceId: 'hbo', serviceName: 'HBO Max', planName: '標準方案', hostName: hosts.h1.name, hostAvatarInitial: hosts.h1.initial, hostAvatarColor: hosts.h1.color, pricePerSeat: twd(28.99, rate, { perYear: true }), billingCycle: 'monthly', nextBillingDate: '2026-06-15', joinedAt: '2026-01-25', paymentStatus: 'markedPaid', status: 'active', createdAt: '2026-01-25', updatedAt: '2026-05-17', _demo: D },
  ]

  // ── Notifications ─────────────────────────────────────────────────
  const notifications = [
    { id: 'demo_notif_01', userId: uid, type: 'new_application',      title: '新的加入申請', message: '江文彬 申請加入你的 Spotify Premium 群組', isRead: false, createdAt: '2026-05-18', _demo: D },
    { id: 'demo_notif_02', userId: uid, type: 'payment',              title: '成員標記付款', message: '王大偉 已標記付款 Netflix 高級（4K）本期費用 NT$98', isRead: false, createdAt: '2026-05-18', _demo: D },
    { id: 'demo_notif_03', userId: uid, type: 'payment',              title: '成員標記付款', message: '劉詩涵 已標記付款 Netflix 高級（4K）本期費用 NT$98', isRead: false, createdAt: '2026-05-17', _demo: D },
    { id: 'demo_notif_04', userId: uid, type: 'payment',              title: '成員標記付款', message: '吳俊霖 已標記付款 Netflix 高級（4K）本期費用 NT$98', isRead: true,  createdAt: '2026-05-16', _demo: D },
    { id: 'demo_notif_05', userId: uid, type: 'application_approved', title: '申請已送出', message: '你已申請加入 Apple Music 家庭方案，等待團主審核', isRead: true,  createdAt: '2026-05-17', _demo: D },
    { id: 'demo_notif_06', userId: uid, type: 'payment_confirmed',    title: '付款確認', message: 'ChatGPT Plus 團主已確認收到你 5 月的費用 NT$325', isRead: true,  createdAt: '2026-05-16', _demo: D },
    { id: 'demo_notif_07', userId: uid, type: 'new_application',      title: '新的加入申請', message: '蔡欣儀 申請加入你的 Spotify Premium 群組', isRead: false, createdAt: '2026-05-19', _demo: D },
    { id: 'demo_notif_08', userId: uid, type: 'payment_reminder',     title: '即將到期提醒', message: 'Disney+ 標準方案 將於 5 月 27 日扣款 NT$45，請確認帳戶餘額', isRead: false, createdAt: '2026-05-20', _demo: D },
    { id: 'demo_notif_09', userId: uid, type: 'application_rejected', title: '申請未通過', message: '很抱歉，你申請加入的 Microsoft 365 家庭版群組申請未通過', isRead: true,  createdAt: '2026-05-09', _demo: D },
  ]

  // ── Favorites ─────────────────────────────────────────────────────
  const favorites = [
    { id: 'demo_fav_01', userId: uid, groupId: 'demo_group_disney_01',   createdAt: '2026-05-10', _demo: D },
    { id: 'demo_fav_02', userId: uid, groupId: 'demo_group_googleone_01', createdAt: '2026-05-12', _demo: D },
  ]

  return { groups, members, applications, subscriptions, notifications, favorites }
}

// ── Seed helper (batch write, 400 ops per batch) ───────────────────
async function seedCollection(name, records) {
  const CHUNK = 400
  let total = 0
  for (let i = 0; i < records.length; i += CHUNK) {
    const batch = writeBatch(db)
    records.slice(i, i + CHUNK).forEach(r => {
      batch.set(doc(collection(db, name), r.id), r)
    })
    await batch.commit()
    total += Math.min(CHUNK, records.length - i)
  }
  console.log(`  ✓ ${name.padEnd(16)} ${total} 筆`)
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log(`\nSeeding demo data → ${process.env.VITE_FIREBASE_PROJECT_ID}\n`)

  const rate = await getUsdToTwd()
  console.log(`  💱 USD/TWD rate: ${rate.toFixed(2)}\n`)

  console.log('Demo account:')
  const uid = await getDemoUid()
  console.log('  UID:', uid)
  console.log()

  const data = buildDemoData(uid, rate)

  console.log('Writing collections:')
  await seedCollection('groups',        data.groups)
  await seedCollection('members',       data.members)
  await seedCollection('applications',  data.applications)
  await seedCollection('subscriptions', data.subscriptions)
  await seedCollection('notifications', data.notifications)
  await seedCollection('favorites',     data.favorites)

  console.log(`
Demo data seeded successfully!

Login with:
  Email:    ${DEMO_EMAIL}
  Password: ${DEMO_PASSWORD}

To show demo data in the app, set VITE_DEMO_MODE=true in .env and restart the dev server.
To remove demo data, run: node scripts/clearDemo.mjs
`)
  process.exit(0)
}

main().catch(err => {
  console.error('\n✗ Seed failed:', err.message ?? err)
  process.exit(1)
})
