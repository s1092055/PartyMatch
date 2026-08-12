/**
 * 建立 demo 資料。這支腳本完全透過真實 REST API（跟前端呼叫的端點一模一樣）驅動每個場景，
 * 不直接寫資料庫，確保 demo 資料的狀態、代管金額、餘額等數字都是「正式版程式碼真的跑過一次」
 * 得到的結果，而不是手動塞值模擬出來的。
 *
 * 例外（無法透過任何現有 API 做到，明確標註）：
 *   - isAdmin 旗標：沒有任何路由能設定，管理員帳號註冊後直接用 Prisma 補一次
 *   - 訊息/通知已讀狀態：跑完所有情境後統一標記已讀，避免一登入就看到一堆嚇人的未讀角標；
 *     通知有 PATCH /notifications/read-all 可以用真實 API，但訊息的已讀 API
 *     （PATCH /conversations/:id/read）一次只清一個使用者，同一對話多位參與者要清時
 *     並行呼叫會互相用舊快照蓋掉對方剛清空的結果（read-modify-write race），改用 Prisma
 *     直接整批歸零 unreadCounts
 *
 * 帳號規劃（7 個，2025-08 從原本 10 個精簡）：2 位團主（H1、H2，互相交錯身兼對方群組的成員，
 * 才能測「同一使用者同時是這個群組的團主、又是另一個群組的一般成員」）＋ 4 位一般成員
 * （D1～D4，其中 D4 一開始刻意維持低額 PM 幣以示範「餘額不足擋下申請」，示範完會補足儲值）＋
 * 1 位管理員。完整的帳號規劃理由與每個帳號適合測什麼情境見 docs-private/testing/test-accounts.md。
 *
 * 執行前提：
 *   1. 後端伺服器要在跑（node --watch src/server.js 或 npm run dev），因為這支腳本會打
 *      真實的 HTTP API，不是單純寫資料庫
 *   2. 資料庫要是乾淨的（先 npm run db:clear），因為使用者是用 POST /auth/register
 *      建立，重複執行會因為 email 已存在而失敗
 *   3. 服務目錄要先跑過 npm run db:seed
 *
 * 執行：cd server && node prisma/seedDemo.js
 */
import 'dotenv/config'
import prisma from '../src/lib/prisma.js'
import { SERVICES } from '../../src/common/data/serviceCatalog.js'

const BASE = process.env.SEED_API_BASE ?? `http://localhost:${process.env.PORT ?? 3001}/api`
const DEMO_PASSWORD = 'Demo1234'
// 管理員帳號密碼可用環境變數覆寫（正式環境用），不設定就 fallback 回跟其他 demo 帳號一樣的密碼
// （本機開發用）；正式環境的 server/.env.production 有設定專屬密碼，重置 demo 資料時不會被
// 打回公開文件寫過的預設密碼
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEMO_PASSWORD

// ── API 呼叫工具 ──────────────────────────────────────────────────────────
async function api(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`)
  return data
}

async function registerUser({ email, name, phone, password = DEMO_PASSWORD }) {
  const { user, accessToken } = await api('POST', '/auth/register', null, { email, password, name, phone })
  return { id: user.id, email, name, token: accessToken }
}

async function topup(user, amount) {
  // POST /tokens/topup 單筆上限 100000，這裡的金額都遠低於上限，一次呼叫即可
  await api('POST', '/tokens/topup', user.token, { amount })
}

// 送出申請並由團主接受，回傳該筆 application id；new_application/application_sent/
// application_approved 這些通知現在由後端 POST /applications、PATCH /applications/:id
// 在同一個請求內自動建立，這裡不用再另外呼叫
async function applyAndApprove(hostUser, groupId, applicant, message) {
  const app = await api('POST', '/applications', applicant.token, { groupId, message })
  await api('PATCH', `/applications/${app.id}`, hostUser.token, { status: 'approved' })
  return app.id
}

async function fillInfo(member, memberId, serviceInfo) {
  return api('PATCH', `/members/${memberId}`, member.token, { serviceInfo })
}

async function getMemberId(hostUser, groupId, userId) {
  const members = await api('GET', `/members?groupId=${groupId}`, hostUser.token)
  return members.find(m => m.userId === userId)?.id
}

// 團主鎖定群組前，比照前端 useHostActions.js 的順序先建立聊天室；group_chat_opened／
// fill_service_info 通知現在由後端 POST /groups/:id/lock 自動建立，不用再另外呼叫
async function lockGroup(hostUser, groupId) {
  const conv = await api('POST', '/conversations/group', hostUser.token, { groupId })
  await api('POST', `/groups/${groupId}/lock`, hostUser.token)
  return conv.id
}

// 比照前端 handleActivate：啟用服務後是系統訊息宣布，不是團主自己打字；
// group_activated 通知現在由後端 POST /groups/:id/activate 自動建立
async function activateGroup(hostUser, groupId, convId, serviceName) {
  await api('POST', `/groups/${groupId}/activate`, hostUser.token)
  await sendSystemMessage(hostUser, convId, `${serviceName} 服務已啟用！請在 48 小時內確認服務是否正常運作。`)
}

async function sendMessage(user, convId, content) {
  return api('POST', `/conversations/${convId}/messages`, user.token, { content })
}

// 比照前端 useHostActions.js 的 sendSystemMessage：群組狀態變化的系統公告要用 type:'system'，
// 聊天室裡會用「置中灰字、無頭像」呈現，不是團主自己打字發送的一般訊息
async function sendSystemMessage(user, convId, content) {
  return api('POST', `/conversations/${convId}/messages`, user.token, { content, type: 'system' })
}

// 團主／成員在確認期針對帳號密碼直接溝通用的留言區，示範圖片附件功能
async function addCredentialComment(user, groupId, content, attachmentUrl) {
  return api('POST', '/credential-comments', user.token, { groupId, content, attachmentUrl })
}

// ── 服務目錄查詢（GET /services 是公開唯讀端點，不需要另外用 Prisma 查） ──
let SERVICE_MAP = null
async function getPlan(serviceId, planId) {
  if (!SERVICE_MAP) {
    const list = await api('GET', '/services', null)
    SERVICE_MAP = Object.fromEntries(list.map(s => [s.id, s]))
  }
  const service = SERVICE_MAP[serviceId]
  if (!service) throw new Error(`找不到服務 ${serviceId}，請先執行 npm run db:seed`)
  const plan = service.plans.find(p => p.id === planId)
  if (!plan) throw new Error(`找不到方案 ${serviceId}/${planId}`)
  return plan
}

function lookupTags(serviceId, planName) {
  const service = SERVICES.find(s => s.id === serviceId)
  if (!service) return []
  const plan = service.plans.find(p => p.name === planName) ?? service.plans[0]
  return [...new Set([...(plan?.tags ?? []), service.category].filter(Boolean))]
}

async function createGroup(hostUser, { serviceId, planId, maxMembers, billingCycle = 'monthly', minCreditScore = 0 }) {
  const plan = await getPlan(serviceId, planId)
  const monthlyFee = Math.ceil((billingCycle === 'yearly' && plan.yearlyFee ? plan.yearlyFee : plan.monthlyFee) / maxMembers)
  return api('POST', '/groups', hostUser.token, {
    serviceId, planId, planName: plan.name, maxMembers, monthlyFee, billingCycle, minCreditScore,
    rules: ['請準時繳費，勿分享帳號給非成員使用'],
    tags: lookupTags(serviceId, plan.name),
  })
}

async function main() {
  console.log(`開始建立 demo 資料（透過 ${BASE} 的真實 API）...\n`)

  // ── 使用者：2 個團主帳號 + 4 個一般成員帳號 + 1 個管理員帳號 ──────────
  const H1 = await registerUser({ email: 'demo1@partymatch.test', name: '吳志豪', phone: '+886911000001' })
  const H2 = await registerUser({ email: 'demo2@partymatch.test', name: '許雅涵', phone: '+886911000002' })
  const D1 = await registerUser({ email: 'demo3@partymatch.test', name: '王小明', phone: '+886911000003' })
  const D2 = await registerUser({ email: 'demo4@partymatch.test', name: '林小美', phone: '+886911000004' })
  const D3 = await registerUser({ email: 'demo5@partymatch.test', name: '陳大文', phone: '+886911000005' })
  const D4 = await registerUser({ email: 'demo6@partymatch.test', name: '李冠宇', phone: '+886911000006' })
  const ADMIN = await registerUser({ email: 'demo-admin@partymatch.test', name: '平台管理員', phone: '+886911000099', password: ADMIN_PASSWORD })
  await prisma.user.update({ where: { id: ADMIN.id }, data: { isAdmin: true } }) // 唯一沒有 API 可做的例外
  console.log('已註冊 7 個帳號（demo1~demo2 團主、demo3~demo6 成員、demo-admin 管理員）')

  // PM幣餘額：demo6（D4）一開始刻意維持低額，先用來示範「餘額不足擋下申請」，示範完再儲值到
  // 跟其他成員一樣的水準，避免後面其他情境的申請/續訂扣款也一併被擋下
  // demo3（D1）比其他成員多留一些餘額：G1 的 Netflix 年繳申請故意一直卡在 pending 沒有審核
  // （示範用），代管費用會整支腳本期間都鎖住拿不回來，是唯一一個「有一筆錢永遠回不來」的帳號
  await topup(H1, 6000); await topup(H2, 6000)
  await topup(D1, 6500); await topup(D2, 4500); await topup(D3, 4500)
  await topup(D4, 500)
  console.log('已完成PM幣儲值\n')

  // ── G1 recruiting：demo1 主揪 Netflix（年繳），demo3 送出 1 筆待審申請 ──
  const g1 = await createGroup(H1, { serviceId: 'netflix', planId: 'netflix-std', maxMembers: 2, billingCycle: 'yearly' })
  await api('POST', '/applications', D1.token, { groupId: g1.id, message: '想加入！平常都用 Netflix 追劇，穩定準時繳費 🙏' })
  // 示範「PM幣餘額不足擋下申請」：demo6 此時只有 500 PM，申請年繳 Netflix 需要的席位費用遠超過這個數字
  try {
    await api('POST', '/applications', D4.token, { groupId: g1.id, message: '也想加入！' })
    throw new Error('預期應該要因為 PM幣餘額不足被擋下，但沒有')
  } catch (err) {
    if (!String(err.message).includes('INSUFFICIENT_BALANCE')) throw err
  }
  await topup(D4, 4000) // 示範完畢，補足到跟其他成員一樣的 4500 水準
  console.log('G1 recruiting（Netflix，年繳，1 筆待審申請 + demo6 示範餘額不足被擋下）')

  // ── G2 recruiting：demo2 主揪 Notion，1 位接受成員 + 1 筆拒絕 ──────────
  const g2 = await createGroup(H2, { serviceId: 'notion', planId: 'notion-business-monthly', maxMembers: 3 })
  await applyAndApprove(H2, g2.id, D1, 'Notion，長期需要團隊協作空間')
  const g2App2 = await api('POST', '/applications', D2.token, { groupId: g2.id, message: '可以加入嗎？' })
  await api('PATCH', `/applications/${g2App2.id}`, H2.token, { status: 'rejected' })
  await api('POST', `/favorites/${g2.id}`, H1.token)
  console.log('G2 recruiting（Notion，1 位接受 + 1 位拒絕，demo1 已收藏）')

  // ── G3 full：demo1 主揪 Spotify（Duo），滿員 + 1 筆取消 ────────────────
  const g3 = await createGroup(H1, { serviceId: 'spotify', planId: 'spotify-duo', maxMembers: 2 })
  const g3AppCancel = await api('POST', '/applications', D2.token, { groupId: g3.id, message: '手滑申請到了，抱歉' })
  await api('DELETE', `/applications/${g3AppCancel.id}`, D2.token) // 取消，此時仍在 recruiting 才能取消
  await applyAndApprove(H1, g3.id, D1, 'Spotify Duo，跟室友分攤')
  console.log('G3 full（Spotify Duo，1 位成員＋團主共 2 人滿員 + 1 筆取消）')

  // ── G4 pending_confirmation：demo2 主揪 Disney+，剛鎖定尚未填寫（shared_credentials）──
  const g4 = await createGroup(H2, { serviceId: 'disney', planId: 'disney-std-monthly', maxMembers: 2 })
  await applyAndApprove(H2, g4.id, D1, 'Disney+，想看漫威跟皮克斯')
  await lockGroup(H2, g4.id)
  // 示範帳號資訊留言區的圖片附件功能：團主先留言告知帳密設定中，附一張截圖
  await addCredentialComment(H2, g4.id, '帳號密碼正在設定中，晚點補上，先附上訂閱成立的截圖給大家確認', 'https://picsum.photos/seed/credential-attachment/600/400')
  console.log('G4 pending_confirmation（Disney+，剛鎖定，成員尚未填寫；帳號資訊留言區已示範圖片附件）')

  // ── G5 pending_activation：demo1 主揪 HBO Max，全員已填完待啟用 ─────────
  const g5 = await createGroup(H1, { serviceId: 'hbo', planId: 'hbo-std-monthly', maxMembers: 3 })
  const g5Members = [D1, D2]
  for (const u of g5Members) await applyAndApprove(H1, g5.id, u, 'HBO Max')
  const g5ConvId = await lockGroup(H1, g5.id)
  for (const u of g5Members) {
    const memberId = await getMemberId(H1, g5.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await sendMessage(H1, g5ConvId, '帳號資訊都填好了嘛？麻煩填完跟我說一聲')
  console.log('G5 pending_activation（HBO Max，全員已填完，待啟用）')

  // ── G6 confirming：demo2 主揪 ChatGPT Team，48h 確認期中，尚無人確認 ────
  const g6 = await createGroup(H2, { serviceId: 'chatgpt', planId: 'chatgpt-team-monthly', maxMembers: 2 })
  await applyAndApprove(H2, g6.id, H1, 'ChatGPT Team，另一個團主身兼成員的示範帳號')
  const g6ConvId = await lockGroup(H2, g6.id)
  const g6MemberId = await getMemberId(H2, g6.id, H1.id)
  await fillInfo(H1, g6MemberId, { email: H1.email })
  await activateGroup(H2, g6.id, g6ConvId, 'ChatGPT Team')
  console.log('G6 confirming（ChatGPT Team，demo1 身兼團主與成員兩種身分，尚無人確認）')

  // ── G7 disputed：demo1 主揪 ExpressVPN，demo5 申訴中，尚未處理（留給現場示範）──
  const g7 = await createGroup(H1, { serviceId: 'expressvpn', planId: 'expressvpn-monthly', maxMembers: 2 })
  await applyAndApprove(H1, g7.id, D3, 'ExpressVPN')
  const g7ConvId = await lockGroup(H1, g7.id)
  const g7MemberId = await getMemberId(H1, g7.id, D3.id)
  await fillInfo(D3, g7MemberId, { acknowledged: true })
  await activateGroup(H1, g7.id, g7ConvId, 'ExpressVPN')
  await api('POST', `/groups/${g7.id}/dispute`, D3.token, {
    reason: '帳號一直登入不進去，密碼好像被改過了', evidenceUrl: 'https://picsum.photos/seed/dispute1/600/400',
  })
  await sendMessage(D3, g7ConvId, '帳號登入不進去，我已經回報問題了')
  console.log('G7 disputed（ExpressVPN，demo5 申訴中，尚未處理——留給測試者現場示範自行解決或管理員裁定）')

  // ── G8 active：demo2 主揪 Google One（AI Plus），全員確認後已撥款 + 2 則評價 ──
  const g8 = await createGroup(H2, { serviceId: 'google-one', planId: 'google-one-ai-plus-monthly', maxMembers: 3 })
  const g8Members = [D1, D2]
  for (const u of g8Members) await applyAndApprove(H2, g8.id, u, 'Google One')
  const g8ConvId = await lockGroup(H2, g8.id)
  for (const u of g8Members) {
    const memberId = await getMemberId(H2, g8.id, u.id)
    await fillInfo(u, memberId, { googleEmail: u.email })
  }
  await activateGroup(H2, g8.id, g8ConvId, 'Google One')
  for (const u of g8Members) await api('POST', `/groups/${g8.id}/confirm`, u.token)
  await api('POST', '/reviews', D1.token, { groupId: g8.id, rating: 5, comment: '團主人很好，服務很快就設定好了！' })
  await api('POST', '/reviews', D2.token, { groupId: g8.id, rating: 4, comment: '整體順利，溝通也很即時。' })
  console.log('G8 active（Google One，全員確認撥款完成，已有 2 則評價）')

  // ── G9 active：demo1 主揪 KKBOX，示範「招募期間退出釋出名額」再補滿 ──────
  const g9 = await createGroup(H1, { serviceId: 'kkbox', planId: 'kkbox-3', maxMembers: 3 })
  await applyAndApprove(H1, g9.id, H2, 'KKBOX')
  await applyAndApprove(H1, g9.id, D3, 'KKBOX') // 湊滿 2/2（+ 團主共 3 人）→ full
  const g9LeaveMemberId = await getMemberId(H1, g9.id, D3.id)
  await api('DELETE', `/members/${g9LeaveMemberId}`, D3.token) // demo5 自行退出，full → recruiting，退回代管費用
  await applyAndApprove(H1, g9.id, D2, 'KKBOX') // 名額釋出後由 demo4 補滿
  const g9ConvId = await lockGroup(H1, g9.id)
  for (const u of [H2, D2]) {
    const memberId = await getMemberId(H1, g9.id, u.id)
    await fillInfo(u, memberId, { email: u.email, address: '台北市信義區松仁路 100 號' })
  }
  await activateGroup(H1, g9.id, g9ConvId, 'KKBOX')
  await sendMessage(H1, g9ConvId, '大家的帳號都設定好了，開始用吧！')
  for (const u of [H2, D2]) await api('POST', `/groups/${g9.id}/confirm`, u.token)
  console.log('G9 active（KKBOX，demo5 曾在招募期間退出，demo4 遞補後正式啟用）')

  // ── G10 cancelled：demo2 主揪 Discord，招募中就解散（部分成員退款）─────
  const g10 = await createGroup(H2, { serviceId: 'discord', planId: 'discord-family-monthly', maxMembers: 2 })
  await applyAndApprove(H2, g10.id, D4, 'Discord')
  await api('POST', `/groups/${g10.id}/cancel`, H2.token)
  console.log('G10 cancelled（Discord，招募中解散，demo6 全額退款）')

  // ── G11 cancelled：demo1 主揪 Crunchyroll，滿員後解散（全員退款）───────
  const g11 = await createGroup(H1, { serviceId: 'crunchyroll', planId: 'crunchyroll-mega', maxMembers: 4 })
  await applyAndApprove(H1, g11.id, D1, 'Crunchyroll')
  await applyAndApprove(H1, g11.id, D2, 'Crunchyroll')
  await applyAndApprove(H1, g11.id, D3, 'Crunchyroll')
  await api('POST', `/groups/${g11.id}/cancel`, H1.token)
  console.log('G11 cancelled（Crunchyroll，滿員後解散，demo3/demo4/demo5 全額退款）')

  // ── G12 ended：demo2 主揪 Duolingo，完整跑完一輪後主動結束服務 + 2 則評價 ──
  const g12 = await createGroup(H2, { serviceId: 'duolingo', planId: 'duolingo-family', maxMembers: 3 })
  await applyAndApprove(H2, g12.id, D1, 'Duolingo')
  await applyAndApprove(H2, g12.id, D3, 'Duolingo')
  const g12ConvId = await lockGroup(H2, g12.id)
  for (const u of [D1, D3]) {
    const memberId = await getMemberId(H2, g12.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(H2, g12.id, g12ConvId, 'Duolingo')
  for (const u of [D1, D3]) await api('POST', `/groups/${g12.id}/confirm`, u.token)
  await api('PATCH', `/groups/${g12.id}`, H2.token, { status: 'ended' })
  await sendMessage(H2, g12ConvId, '這期服務即將到期，之後不續訂了，謝謝大家一起共享')
  await api('POST', '/reviews', D1.token, { groupId: g12.id, rating: 5, comment: '整體使用很順暢，團主人很好，有問題都馬上回覆。' })
  await api('POST', '/reviews', D3.token, { groupId: g12.id, rating: 4, comment: '服務蠻穩定的，推薦！' })
  console.log('G12 ended（Duolingo，完整跑完一輪後結束服務）')

  // ── G_removed：demo1 主揪 MasterClass（2人方案），demo4 招募期間被移除（信用分數扣分）──
  // 團主移除成員現在會自動觸發 -10 分（DELETE /members/:id 內的 adjustCreditScore，
  // 見 server/src/utils/creditScore.js），不用再額外用 Prisma 手動扣分
  const gRemoved = await createGroup(H1, { serviceId: 'masterclass', planId: 'masterclass-2', maxMembers: 2, billingCycle: 'yearly' })
  await applyAndApprove(H1, gRemoved.id, D2, 'MasterClass')
  const gRemovedMemberId = await getMemberId(H1, gRemoved.id, D2.id)
  await api('DELETE', `/members/${gRemovedMemberId}`, H1.token) // 團主移除，退款 + 標記 application 為 removed + 自動扣 10 分信用分數
  console.log('G_removed（MasterClass，demo4 被團主移除並自動扣 10 分信用分數）')

  // ── G13 recruiting：demo2 主揪 Canva，設信用分數門檻，尚無人申請 ────────
  await createGroup(H2, { serviceId: 'canva', planId: 'canva-team-monthly', maxMembers: 5, minCreditScore: 70 })
  console.log('G13 recruiting（Canva，minCreditScore: 70，尚無人申請）')

  // ── G14 confirming：demo1 主揪 Cursor，一人已確認、一人尚未（測試部分確認顯示）──
  const g14 = await createGroup(H1, { serviceId: 'cursor', planId: 'cursor-business-monthly', maxMembers: 3 })
  await applyAndApprove(H1, g14.id, D1, 'Cursor')
  await applyAndApprove(H1, g14.id, D4, 'Cursor')
  const g14ConvId = await lockGroup(H1, g14.id)
  for (const u of [D1, D4]) {
    const memberId = await getMemberId(H1, g14.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(H1, g14.id, g14ConvId, 'Cursor')
  await api('POST', `/groups/${g14.id}/confirm`, D1.token) // 只有 demo3 確認，demo6 尚未確認
  console.log('G14 confirming（Cursor，demo3 已確認、demo6 尚未確認）')

  // ── G15 pending_confirmation：demo2 主揪 Apple Music（家庭方案 6 人），全新鎖定尚未填寫（apple_family）──
  const g15 = await createGroup(H2, { serviceId: 'apple-music', planId: 'apple-music-family-monthly', maxMembers: 6 })
  for (const u of [H1, D1, D2, D3, D4]) await applyAndApprove(H2, g15.id, u, 'Apple Music')
  await lockGroup(H2, g15.id)
  console.log('G15 pending_confirmation（Apple Music，apple_family，6 人全新鎖定尚未填寫）')

  // ── G16 pending_confirmation：demo1 主揪 Google One（100GB），全新鎖定尚未填寫（google_family）──
  const g16 = await createGroup(H1, { serviceId: 'google-one', planId: 'google-one-100-monthly', maxMembers: 2 })
  await applyAndApprove(H1, g16.id, D2, 'Google One')
  await lockGroup(H1, g16.id)
  console.log('G16 pending_confirmation（Google One，google_family，全新鎖定尚未填寫）')

  // ── G17 pending_confirmation：demo2 主揪 friDay影音，全新鎖定尚未填寫（invite_code）──
  const g17 = await createGroup(H2, { serviceId: 'friday-video', planId: 'friday-video-plan', maxMembers: 2 })
  await applyAndApprove(H2, g17.id, D3, 'friDay影音')
  await lockGroup(H2, g17.id)
  console.log('G17 pending_confirmation（friDay影音，invite_code，全新鎖定尚未填寫）')

  // ── G18 recruiting：demo1 主揪 iCloud+，示範團主手動加入成員（略過申請流程）──
  const g18 = await createGroup(H1, { serviceId: 'icloud', planId: 'icloud-200', maxMembers: 3 })
  await api('POST', '/members', H1.token, { groupId: g18.id, userId: D4.id })
  console.log('G18 recruiting（iCloud+，demo1 手動加入 demo6，仍有 1 個空位開放申請）')

  // ── G19 pending_confirmation（第 2 期）：demo2 主揪 Microsoft 365（家庭 6 人），跑完一輪後續訂 ──
  const g19 = await createGroup(H2, { serviceId: 'microsoft-365', planId: 'microsoft-365-family-monthly', maxMembers: 6 })
  const g19Members = [H1, D1, D2, D3, D4]
  for (const u of g19Members) await applyAndApprove(H2, g19.id, u, 'Microsoft 365')
  const g19ConvId = await lockGroup(H2, g19.id)
  for (const u of g19Members) {
    const memberId = await getMemberId(H2, g19.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(H2, g19.id, g19ConvId, 'Microsoft 365')
  for (const u of g19Members) await api('POST', `/groups/${g19.id}/confirm`, u.token)
  await api('POST', `/groups/${g19.id}/renew`, H2.token) // active → pending_confirmation，第二期代管扣款、清空帳號資訊
  console.log('G19 pending_confirmation（Microsoft 365，已跑完第 1 期並開始續訂第 2 期）')

  // ── G20 active：demo1 主揪 Dropbox（Family 6 人），申訴後管理員裁定「成員獲勝」+ 2 則評價 ──
  const g20 = await createGroup(H1, { serviceId: 'dropbox', planId: 'dropbox-family', maxMembers: 6 })
  const g20Members = [H2, D1, D2, D3, D4]
  for (const u of g20Members) await applyAndApprove(H1, g20.id, u, 'Dropbox')
  const g20ConvId = await lockGroup(H1, g20.id)
  for (const u of g20Members) {
    const memberId = await getMemberId(H1, g20.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(H1, g20.id, g20ConvId, 'Dropbox')
  await api('POST', `/groups/${g20.id}/dispute`, D2.token, { reason: '帳號被收回，登入不進去', evidenceUrl: 'https://picsum.photos/seed/dispute2/600/400' })
  await api('POST', `/groups/${g20.id}/adjudicate`, ADMIN.token, { winner: 'member', reason: '經查證團主確實未提供正確帳號，退款給申訴成員' })
  await api('POST', '/reviews', D1.token, { groupId: g20.id, rating: 3, comment: '中間有點小狀況，但申訴後平台有妥善處理。' })
  await api('POST', '/reviews', D3.token, { groupId: g20.id, rating: 5, comment: '我這邊都沒遇到問題，運作正常。' })
  console.log('G20 active（Dropbox，申訴後管理員裁定成員獲勝，demo4 已退款離開）')

  // ── G21 active：demo2 主揪 NordVPN，申訴後管理員裁定「團主獲勝」+ 2 則評價 ──
  const g21 = await createGroup(H2, { serviceId: 'nordvpn', planId: 'nordvpn-basic', maxMembers: 3 })
  await applyAndApprove(H2, g21.id, D3, 'NordVPN')
  await applyAndApprove(H2, g21.id, D4, 'NordVPN')
  const g21ConvId = await lockGroup(H2, g21.id)
  for (const u of [D3, D4]) {
    const memberId = await getMemberId(H2, g21.id, u.id)
    await fillInfo(u, memberId, { acknowledged: true })
  }
  await activateGroup(H2, g21.id, g21ConvId, 'NordVPN')
  await api('POST', `/groups/${g21.id}/dispute`, D4.token, { reason: '覺得速度跟描述不符', evidenceUrl: 'https://picsum.photos/seed/dispute3/600/400' })
  await api('POST', `/groups/${g21.id}/adjudicate`, ADMIN.token, { winner: 'host', reason: '經查證服務正常，維持原訂閱' })
  await api('POST', '/reviews', D3.token, { groupId: g21.id, rating: 4, comment: '服務穩定，速度也不錯。' })
  await api('POST', '/reviews', D4.token, { groupId: g21.id, rating: 5, comment: '申訴後團主還是很有耐心解釋，後續也沒問題了。' })
  console.log('G21 active（NordVPN，申訴後管理員裁定團主獲勝）')

  // ── G22 confirming：demo1 主揪 Claude Pro，申訴後團主與成員自行協調解決（不經管理員）──
  const g22 = await createGroup(H1, { serviceId: 'claude', planId: 'claude-pro', maxMembers: 2 })
  await applyAndApprove(H1, g22.id, D3, 'Claude Pro')
  const g22ConvId = await lockGroup(H1, g22.id)
  const g22MemberId = await getMemberId(H1, g22.id, D3.id)
  await fillInfo(D3, g22MemberId, { acknowledged: true })
  await activateGroup(H1, g22.id, g22ConvId, 'Claude Pro')
  await api('POST', `/groups/${g22.id}/dispute`, D3.token, { reason: '帳號登入不進去，密碼可能被改了', evidenceUrl: 'https://picsum.photos/seed/dispute4/600/400' })
  await addCredentialComment(D3, g22.id, '密碼登入失敗，麻煩確認一下', 'https://picsum.photos/seed/dispute4-comment/600/400')
  await addCredentialComment(H1, g22.id, '不好意思，剛剛忘記更新密碼了，已經改好，麻煩重新登入看看')
  await api('POST', `/groups/${g22.id}/resolve-dispute`, H1.token, { note: '已重新提供正確密碼，成員確認可以正常登入' })
  console.log('G22 confirming（Claude Pro，demo5 申訴後團主自行處理完成，不經管理員裁定——新版「自行解決」流程示範）')

  // ── 系統公告（透過管理員帳號的真實廣播 API）───────────────────────────
  await api('POST', '/system-messages/broadcast', ADMIN.token, {
    content: 'PartyMatch 將於本週六凌晨 2:00-4:00 進行例行維護，期間服務可能短暫中斷',
  })
  console.log('已發送系統公告')

  // ── DM 私訊：demo1 主動聯繫 demo2，含圖片附件示範 ─────────────────────
  const dm = await api('POST', '/conversations/dm', H1.token, { targetUserId: H2.id })
  await api('POST', `/conversations/${dm.id}/messages`, H1.token, { content: '嗨，想請問 Spotify 群組還有名額嗎？' })
  await api('POST', `/conversations/${dm.id}/messages`, H2.token, { content: '目前剛好滿囉，不好意思！之後有名額會再通知你' })
  await api('POST', `/conversations/${dm.id}/messages`, H1.token, { content: '好的，附上我截的名額狀態給你參考', attachmentUrl: 'https://picsum.photos/seed/dm-attachment/600/400' })
  console.log('已建立 demo1 → demo2 的 DM 私訊（含圖片附件示範）')

  // ── 全部標記已讀 ──────────────────────────────────────────────────────
  // seed 資料代表「已經發生過的歷史」，不是使用者剛登入時的新通知/訊息；notify() 建立通知、
  // appendMessage() 更新未讀數時都是套用一般使用者的預設行為（isRead: false、unreadCounts+1），
  // 整支腳本跑完後這裡才統一補一次「已讀」動作，一登入才不會看到一堆嚇人的未讀角標
  const allUsers = [H1, H2, D1, D2, D3, D4, ADMIN]
  await Promise.all(allUsers.map(u => api('PATCH', '/notifications/read-all', u.token)))
  // 訊息已讀沒有對應的「批次清空」API（PATCH /conversations/:id/read 一次只清一個使用者），
  // 同一個對話有多位參與者時，並行呼叫會互相用舊快照蓋掉對方剛清空的結果（read-modify-write
  // race，見 server/src/routes/conversations.js 的 :id/read）；直接用 Prisma 整批歸零
  // unreadCounts，比逐一呼叫 API 安全，也不用擔心呼叫順序
  await prisma.conversation.updateMany({ data: { unreadCounts: {} } })
  console.log('已將所有通知與訊息標記為已讀')

  console.log(`\ndemo 資料建立完成！共 7 個帳號、23 個群組，demo1~demo6 密碼皆為: ${DEMO_PASSWORD}；demo-admin ${process.env.ADMIN_PASSWORD ? '使用 ADMIN_PASSWORD 環境變數設定的密碼' : `密碼同上（未設定 ADMIN_PASSWORD）: ${DEMO_PASSWORD}`}`)
  console.log('  demo1～demo2：團主帳號（互相交錯身兼對方群組成員）　demo3～demo6：一般成員帳號（demo6 曾示範餘額不足，之後已補足儲值）　demo-admin：管理員帳號')
}

main()
  .catch(err => { console.error('建立 demo 資料失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
