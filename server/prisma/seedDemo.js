/**
 * 建立 demo 資料。跟舊版最大的差別：這支腳本完全透過真實 REST API（跟前端呼叫的
 * 端點一模一樣）驅動每個場景，不直接寫資料庫，確保 demo 資料的狀態、代管金額、
 * 餘額等數字都是「正式版程式碼真的跑過一次」得到的結果，而不是手動塞值模擬出來的。
 *
 * 例外（無法透過任何現有 API 做到，明確標註）：
 *   - isAdmin 旗標：沒有任何路由能設定，管理員帳號註冊後直接用 Prisma 補一次
 *   - 信用分數增減：目前系統本身還沒有任何會員行為觸發信用分數變動的路由
 *     （adjustCreditScore 在前端只是空函式），示範「被移除扣分」情境時用 Prisma 直接調整
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
import { SERVICES } from '../../src/shared/data/serviceCatalog.js'

const BASE = process.env.SEED_API_BASE ?? `http://localhost:${process.env.PORT ?? 3001}/api`
const DEMO_PASSWORD = 'Demo1234'

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

async function registerUser({ email, name, phone }) {
  const { user, accessToken } = await api('POST', '/auth/register', null, { email, password: DEMO_PASSWORD, name, phone })
  return { id: user.id, email, name, token: accessToken }
}

async function topup(user, amount) {
  // POST /tokens/topup 單筆上限 100000，這裡的金額都遠低於上限，一次呼叫即可
  await api('POST', '/tokens/topup', user.token, { amount })
}

async function notify(actingUser, targetUserId, type, title, message, meta) {
  return api('POST', '/notifications', actingUser.token, { userId: targetUserId, type, title, message, meta })
}

// 送出申請並由團主接受，回傳該筆 application id；同時比照前端在申請/接受成功後
// 建立通知的行為，補上 new_application/application_sent/application_approved
async function applyAndApprove(hostUser, groupId, applicant, serviceName, message) {
  const app = await api('POST', '/applications', applicant.token, { groupId, message })
  const meta = { groupId }
  await notify(applicant, hostUser.id, 'new_application', '收到新的加入申請', `${applicant.name} 申請加入你的 ${serviceName} 群組`, meta)
  await notify(applicant, applicant.id, 'application_sent', '申請已送出', `已送出加入 ${serviceName} 群組的申請，等待團主審核`, meta)
  await api('PATCH', `/applications/${app.id}`, hostUser.token, { status: 'approved' })
  await notify(hostUser, applicant.id, 'application_approved', '申請已接受', `你已通過 ${serviceName} 群組審核，請前往填寫服務帳號資訊`, meta)
  return app.id
}

async function fillInfo(member, memberId, serviceInfo) {
  return api('PATCH', `/members/${memberId}`, member.token, { serviceInfo })
}

async function getMemberId(hostUser, groupId, userId) {
  const members = await api('GET', `/members?groupId=${groupId}`, hostUser.token)
  return members.find(m => m.userId === userId)?.id
}

// 團主鎖定群組前，比照前端 useHostActions.js 的順序先建立聊天室，鎖定後通知所有成員；
// 填寫服務帳號改成群組詳情頁的 sub-modal 進行，不再需要另外送一則聊天室操作卡片
async function lockGroup(hostUser, groupId, members = [], serviceName) {
  const conv = await api('POST', '/conversations/group', hostUser.token, { groupId })
  await api('POST', `/groups/${groupId}/lock`, hostUser.token)
  const meta = { groupId }
  await notify(hostUser, hostUser.id, 'group_chat_opened', '群組聊天室已啟用', '群組已鎖定，聊天室已建立，點擊查看。', meta)
  for (const m of members) {
    await notify(hostUser, m.id, 'group_chat_opened', '群組聊天室已啟用', '群組已鎖定，聊天室已建立，點擊查看。', meta)
    await notify(hostUser, m.id, 'fill_service_info', '請填寫服務帳號資訊', `「${serviceName}」群組已鎖定，請進入填寫服務帳號並完成付款。`, meta)
  }
  return conv.id
}

// 比照前端 handleActivate：啟用服務後是系統訊息宣布，不是團主自己打字
async function activateGroup(hostUser, groupId, members, convId, serviceName) {
  await api('POST', `/groups/${groupId}/activate`, hostUser.token)
  const meta = { groupId, openBilling: true }
  for (const m of members) {
    await notify(hostUser, m.id, 'group_activated', '服務已啟用', '服務已啟用，48 小時內確認服務正常即可提前結束等待', meta)
  }
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

  // ── 使用者：3 個團主帳號 + 6 個一般成員帳號 + 1 個管理員帳號 ──────────
  const H1 = await registerUser({ email: 'demo7@partymatch.test', name: '吳志豪', phone: '0911000007' })
  const H2 = await registerUser({ email: 'demo8@partymatch.test', name: '許雅涵', phone: '0911000008' })
  const H3 = await registerUser({ email: 'demo9@partymatch.test', name: '劉建成', phone: '0911000009' })
  const D1 = await registerUser({ email: 'demo1@partymatch.test', name: '王小明', phone: '0911000001' })
  const D2 = await registerUser({ email: 'demo2@partymatch.test', name: '林小美', phone: '0911000002' })
  const D3 = await registerUser({ email: 'demo3@partymatch.test', name: '陳大文', phone: '0911000003' })
  const D4 = await registerUser({ email: 'demo4@partymatch.test', name: '張雅婷', phone: '0911000004' })
  const D5 = await registerUser({ email: 'demo5@partymatch.test', name: '李冠宇', phone: '0911000005' })
  const D6 = await registerUser({ email: 'demo6@partymatch.test', name: '黃詩涵', phone: '0911000006' })
  const ADMIN = await registerUser({ email: 'demo-admin@partymatch.test', name: '平台管理員', phone: '0911000099' })
  await prisma.user.update({ where: { id: ADMIN.id }, data: { isAdmin: true } }) // 唯一沒有 API 可做的例外
  console.log('已註冊 10 個帳號（demo7~demo9 團主、demo1~demo6 成員、demo-admin 管理員）')

  // PM幣餘額：demo6 刻意維持低額（只用於 G7 一筆低成本申請），保留給測試者現場示範
  // 「餘額不足擋下申請」情境（例如去申請 G6 ChatGPT Team 需要 800 PM 一定會被擋下）
  await topup(H1, 8000); await topup(H2, 8000); await topup(H3, 8000)
  await topup(D1, 6000); await topup(D2, 6000); await topup(D3, 6000)
  await topup(D4, 6000); await topup(D5, 6000); await topup(D6, 500)
  console.log('已完成PM幣儲值\n')

  // ── G1 recruiting：demo7 主揪 Netflix（年繳），demo1 送出 1 筆待審申請 ──
  const g1 = await createGroup(H1, { serviceId: 'netflix', planId: 'netflix-std', maxMembers: 2, billingCycle: 'yearly' })
  await api('POST', '/applications', D1.token, { groupId: g1.id, message: '想加入！平常都用 Netflix 追劇，穩定準時繳費 🙏' })
  console.log('G1 recruiting（Netflix，年繳，1 筆待審申請）')

  // ── G2 recruiting：demo4 主揪 Notion，1 位接受成員 + 1 筆拒絕 ──────────
  const g2 = await createGroup(D4, { serviceId: 'notion', planId: 'notion-business-monthly', maxMembers: 3 })
  await applyAndApprove(D4, g2.id, D5, 'Notion')
  const g2App3 = await api('POST', '/applications', D3.token, { groupId: g2.id, message: '可以加入嗎？' })
  await api('PATCH', `/applications/${g2App3.id}`, D4.token, { status: 'rejected' })
  await notify(D4, D3.id, 'application_rejected', '申請未通過', '很抱歉，你申請加入的 Notion 群組審核未通過', { groupId: g2.id })
  await api('POST', `/favorites/${g2.id}`, H1.token)
  console.log('G2 recruiting（Notion，1 位接受 + 1 位拒絕，demo7 已收藏）')

  // ── G3 full：demo8 主揪 Spotify（6 人方案），滿員 + 1 筆撤回 ────────────
  const g3 = await createGroup(H2, { serviceId: 'spotify', planId: 'spotify-family', maxMembers: 6 })
  for (const u of [D1, D2, D3, D4]) await applyAndApprove(H2, g3.id, u, 'Spotify') // 先接受 4/5，group 仍是 recruiting
  const g3AppWithdraw = await api('POST', '/applications', D6.token, { groupId: g3.id, message: '手滑申請到了，抱歉' })
  await api('DELETE', `/applications/${g3AppWithdraw.id}`, D6.token) // 撤回，此時仍在 recruiting 才能撤回
  await applyAndApprove(H2, g3.id, H3, 'Spotify') // 接受第 5 位（+ 團主本人共 6 人），正式額滿 → full
  await notify(H2, H2.id, 'group_full', '群組名額已滿', 'Spotify 群組名額已滿，記得鎖定群組並通知成員填寫帳號資訊', { groupId: g3.id })
  console.log('G3 full（Spotify，5 位成員＋團主共 6 人滿員 + 1 筆撤回）')

  // ── G4 pending_confirmation：demo7 主揪 Disney+，剛鎖定尚未填寫（shared_credentials）──
  const g4 = await createGroup(H1, { serviceId: 'disney', planId: 'disney-std-monthly', maxMembers: 2 })
  await applyAndApprove(H1, g4.id, D2, 'Disney+')
  await lockGroup(H1, g4.id, [D2], 'Disney+')
  console.log('G4 pending_confirmation（Disney+，剛鎖定，成員尚未填寫）')

  // ── G5 pending_activation：demo9 主揪 HBO Max，全員已填完待啟用 ─────────
  const g5 = await createGroup(H3, { serviceId: 'hbo', planId: 'hbo-std-monthly', maxMembers: 3 })
  const g5Members = []
  for (const u of [D3, D5]) {
    await applyAndApprove(H3, g5.id, u, 'HBO Max')
    g5Members.push(u)
  }
  const g5ConvId = await lockGroup(H3, g5.id, g5Members, 'HBO Max')
  for (const u of g5Members) {
    const memberId = await getMemberId(H3, g5.id, u.id)
    await fillInfo(u, memberId, { acknowledged: true })
  }
  await sendMessage(H3, g5ConvId, '帳號資訊都填好了嘛？麻煩填完跟我說一聲')
  console.log('G5 pending_activation（HBO Max，全員已填完，待啟用）')

  // ── G6 confirming：demo8 主揪 ChatGPT Team，48h 確認期中，尚無人確認 ────
  const g6 = await createGroup(H2, { serviceId: 'chatgpt', planId: 'chatgpt-team-monthly', maxMembers: 2 })
  await applyAndApprove(H2, g6.id, H1, 'ChatGPT Team')
  const g6ConvId = await lockGroup(H2, g6.id, [H1], 'ChatGPT Team')
  const g6MemberId = await getMemberId(H2, g6.id, H1.id)
  await fillInfo(H1, g6MemberId, { email: H1.email })
  await activateGroup(H2, g6.id, [H1], g6ConvId, 'ChatGPT Team')
  console.log('G6 confirming（ChatGPT Team，尚無人確認）')

  // ── G7 disputed：demo9 主揪 ExpressVPN，demo6 申訴中，尚未裁定 ──────────
  const g7 = await createGroup(H3, { serviceId: 'expressvpn', planId: 'expressvpn-monthly', maxMembers: 2 })
  await applyAndApprove(H3, g7.id, D6, 'ExpressVPN')
  const g7ConvId = await lockGroup(H3, g7.id, [D6], 'ExpressVPN')
  const g7MemberId = await getMemberId(H3, g7.id, D6.id)
  await fillInfo(D6, g7MemberId, { acknowledged: true })
  await activateGroup(H3, g7.id, [D6], g7ConvId, 'ExpressVPN')
  await api('POST', `/groups/${g7.id}/dispute`, D6.token, {
    reason: '帳號一直登入不進去，密碼好像被改過了', evidenceUrl: 'https://picsum.photos/seed/dispute1/600/400',
  })
  await notify(D6, H3.id, 'dispute_raised', '收到成員問題回報', '黃詩涵 針對 ExpressVPN 服務提出回報問題，將於 48 小時內處理完成', { groupId: g7.id })
  await sendMessage(D6, g7ConvId, '帳號登入不進去，我已經向平台申訴了')
  console.log('G7 disputed（ExpressVPN，demo6 申訴中，等待管理員裁定）')

  // ── G8 active：demo7 主揪 Google One（AI Plus），全員確認後已撥款 + 2 則評價 ──
  const g8 = await createGroup(H1, { serviceId: 'google-one', planId: 'google-one-ai-plus-monthly', maxMembers: 3 })
  const g8Members = [D2, D4]
  for (const u of g8Members) await applyAndApprove(H1, g8.id, u, 'Google One')
  const g8ConvId = await lockGroup(H1, g8.id, g8Members, 'Google One')
  for (const u of g8Members) {
    const memberId = await getMemberId(H1, g8.id, u.id)
    await fillInfo(u, memberId, { googleEmail: u.email })
  }
  await activateGroup(H1, g8.id, g8Members, g8ConvId, 'Google One')
  for (const u of g8Members) await api('POST', `/groups/${g8.id}/confirm`, u.token)
  await notify(H1, H1.id, 'escrow_released', '代管款項已撥款', 'Google One 群組確認期結束，代管款項已撥入你的PM幣餘額', { groupId: g8.id })
  await api('POST', '/reviews', D2.token, { groupId: g8.id, rating: 5, comment: '團主人很好，服務很快就設定好了！' })
  await api('POST', '/reviews', D4.token, { groupId: g8.id, rating: 4, comment: '整體順利，溝通也很即時。' })
  console.log('G8 active（Google One，全員確認撥款完成，已有 2 則評價）')

  // ── G9 active：demo8 主揪 KKBOX（3人方案），示範「招募期間退出釋出名額」再補滿 ──
  const g9 = await createGroup(H2, { serviceId: 'kkbox', planId: 'kkbox-3', maxMembers: 3 })
  await applyAndApprove(H2, g9.id, H1, 'KKBOX')
  await applyAndApprove(H2, g9.id, D5, 'KKBOX') // 湊滿 2/2（+ 團主共 3 人）→ full
  const g9LeaveMemberId = await getMemberId(H2, g9.id, D5.id)
  await api('DELETE', `/members/${g9LeaveMemberId}`, D5.token) // demo5 自行退出，full → recruiting，退回代管費用
  await notify(D5, H2.id, 'member_left', '成員已退出群組', '李冠宇 已退出 KKBOX 群組', { groupId: g9.id })
  await applyAndApprove(H2, g9.id, D1, 'KKBOX') // 名額釋出後由 demo1 補滿
  const g9ConvId = await lockGroup(H2, g9.id, [H1, D1], 'KKBOX')
  for (const u of [H1, D1]) {
    const memberId = await getMemberId(H2, g9.id, u.id)
    await fillInfo(u, memberId, { email: u.email, address: '台北市信義區松仁路 100 號' })
  }
  await activateGroup(H2, g9.id, [H1, D1], g9ConvId, 'KKBOX')
  await sendMessage(H2, g9ConvId, '大家的帳號都設定好了，開始用吧！')
  for (const u of [H1, D1]) await api('POST', `/groups/${g9.id}/confirm`, u.token)
  await notify(H2, H2.id, 'escrow_released', '代管款項已撥款', 'KKBOX 群組確認期結束，代管款項已撥入你的PM幣餘額', { groupId: g9.id })
  console.log('G9 active（KKBOX，demo5 曾在招募期間退出，demo1 遞補後正式啟用）')

  // ── G10a cancelled：demo9 主揪 Discord，招募中就解散（部分成員退款）──────
  const g10a = await createGroup(H3, { serviceId: 'discord', planId: 'discord-family-monthly', maxMembers: 3 })
  await applyAndApprove(H3, g10a.id, D4, 'Discord')
  await api('POST', `/groups/${g10a.id}/cancel`, H3.token)
  await notify(H3, D4.id, 'group_cancelled', '群組已解散', 'Discord 群組已由團主解散，代管款項已全額退還', { groupId: g10a.id })
  console.log('G10a cancelled（Discord，招募中解散，demo4 全額退款）')

  // ── G10b cancelled：demo8 主揪 Crunchyroll，滿員後解散（全員退款）───────
  const g10b = await createGroup(H2, { serviceId: 'crunchyroll', planId: 'crunchyroll-mega', maxMembers: 3 })
  await applyAndApprove(H2, g10b.id, D5, 'Crunchyroll')
  await applyAndApprove(H2, g10b.id, D6, 'Crunchyroll')
  await api('POST', `/groups/${g10b.id}/cancel`, H2.token)
  for (const u of [D5, D6]) await notify(H2, u.id, 'group_cancelled', '群組已解散', 'Crunchyroll 群組已由團主解散，代管款項已全額退還', { groupId: g10b.id })
  console.log('G10b cancelled（Crunchyroll，滿員後解散，demo5/demo6 全額退款）')

  // ── G11 ended：demo8 主揪 Duolingo，完整跑完一輪後主動結束服務 + 2 則評價 ──
  const g11 = await createGroup(H2, { serviceId: 'duolingo', planId: 'duolingo-family', maxMembers: 3 })
  await applyAndApprove(H2, g11.id, D1, 'Duolingo')
  await applyAndApprove(H2, g11.id, D3, 'Duolingo')
  const g11ConvId = await lockGroup(H2, g11.id, [D1, D3], 'Duolingo')
  for (const u of [D1, D3]) {
    const memberId = await getMemberId(H2, g11.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(H2, g11.id, [D1, D3], g11ConvId, 'Duolingo')
  for (const u of [D1, D3]) await api('POST', `/groups/${g11.id}/confirm`, u.token)
  await notify(H2, H2.id, 'escrow_released', '代管款項已撥款', 'Duolingo 群組確認期結束，代管款項已撥入你的PM幣餘額', { groupId: g11.id })
  await api('PATCH', `/groups/${g11.id}`, H2.token, { status: 'ended' })
  for (const u of [D1, D3]) await notify(H2, u.id, 'group_ended', '群組已結束', 'Duolingo 群組已由團主結束服務，感謝這段時間的共享', { groupId: g11.id })
  await sendMessage(H2, g11ConvId, '這期服務即將到期，之後不續訂了，謝謝大家一起共享')
  await api('POST', '/reviews', D1.token, { groupId: g11.id, rating: 5, comment: '整體使用很順暢，團主人很好，有問題都馬上回覆。' })
  await api('POST', '/reviews', D3.token, { groupId: g11.id, rating: 4, comment: '服務蠻穩定的，推薦！' })
  console.log('G11 ended（Duolingo，完整跑完一輪後結束服務）')

  // ── G_removed：demo7 主揪 MasterClass（2人方案），demo2 招募期間被移除（信用分數扣分）──
  const gRemoved = await createGroup(H1, { serviceId: 'masterclass', planId: 'masterclass-2', maxMembers: 2, billingCycle: 'yearly' })
  await applyAndApprove(H1, gRemoved.id, D2, 'MasterClass')
  const gRemovedMemberId = await getMemberId(H1, gRemoved.id, D2.id)
  await api('DELETE', `/members/${gRemovedMemberId}`, H1.token) // 團主移除，退款 + 標記 application 為 removed
  await notify(H1, D2.id, 'member_removed', '已被移出群組', '你已被移出 MasterClass 群組（長期未繳費），信用分數已扣分', { groupId: gRemoved.id })
  await prisma.user.update({ where: { id: D2.id }, data: { creditScore: { decrement: 15 } } }) // 目前系統沒有信用分數 API，僅有的直寫例外
  console.log('G_removed（MasterClass，demo2 被團主移除並扣 15 分信用分數）')

  // ── G12 recruiting：demo6 主揪 Canva，設信用分數門檻，尚無人申請 ────────
  await createGroup(D6, { serviceId: 'canva', planId: 'canva-team-monthly', maxMembers: 5, minCreditScore: 70 })
  console.log('G12 recruiting（Canva，minCreditScore: 70，尚無人申請）')

  // ── G13 confirming：demo4 主揪 Cursor，一人已確認、一人尚未（測試部分確認顯示）──
  const g13 = await createGroup(D4, { serviceId: 'cursor', planId: 'cursor-business-monthly', maxMembers: 3 })
  await applyAndApprove(D4, g13.id, H1, 'Cursor')
  await applyAndApprove(D4, g13.id, D5, 'Cursor')
  const g13ConvId = await lockGroup(D4, g13.id, [H1, D5], 'Cursor')
  for (const u of [H1, D5]) {
    const memberId = await getMemberId(D4, g13.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(D4, g13.id, [H1, D5], g13ConvId, 'Cursor')
  await api('POST', `/groups/${g13.id}/confirm`, H1.token) // 只有 demo7 確認，demo5 尚未確認
  console.log('G13 confirming（Cursor，demo7 已確認、demo5 尚未確認）')

  // ── G14 pending_confirmation：demo9 主揪 Apple Music（家庭方案 6 人），全新鎖定尚未填寫（apple_family）──
  const g14 = await createGroup(H3, { serviceId: 'apple-music', planId: 'apple-music-family-monthly', maxMembers: 6 })
  for (const u of [D1, D2, D3, D4, H1]) await applyAndApprove(H3, g14.id, u, 'Apple Music')
  await lockGroup(H3, g14.id, [D1, D2, D3, D4, H1], 'Apple Music')
  console.log('G14 pending_confirmation（Apple Music，apple_family，全新鎖定尚未填寫）')

  // ── G15 pending_confirmation：demo7 主揪 Google One（100GB），全新鎖定尚未填寫（google_family）──
  const g15 = await createGroup(H1, { serviceId: 'google-one', planId: 'google-one-100-monthly', maxMembers: 2 })
  await applyAndApprove(H1, g15.id, D3, 'Google One')
  await lockGroup(H1, g15.id, [D3], 'Google One')
  console.log('G15 pending_confirmation（Google One，google_family，全新鎖定尚未填寫）')

  // ── G16 pending_confirmation：demo8 主揪 friDay影音，全新鎖定尚未填寫（invite_code）──
  const g16 = await createGroup(H2, { serviceId: 'friday-video', planId: 'friday-video-plan', maxMembers: 2 })
  await applyAndApprove(H2, g16.id, D5, 'friDay影音')
  await lockGroup(H2, g16.id, [D5], 'friDay影音')
  console.log('G16 pending_confirmation（friDay影音，invite_code，全新鎖定尚未填寫）')

  // ── G17 recruiting：demo9 主揪 iCloud+，示範團主手動加入成員（略過申請流程）──
  const g17 = await createGroup(H3, { serviceId: 'icloud', planId: 'icloud-200', maxMembers: 3 })
  await api('POST', '/members', H3.token, { groupId: g17.id, userId: D4.id })
  console.log('G17 recruiting（iCloud+，demo9 手動加入 demo4，仍有 1 個空位開放申請）')

  // ── G18 pending_confirmation（第 2 期）：demo8 主揪 Microsoft 365（家庭 6 人），跑完一輪後續訂 ──
  const g18 = await createGroup(H2, { serviceId: 'microsoft-365', planId: 'microsoft-365-family-monthly', maxMembers: 6 })
  const g18Members = [D1, D2, D3, D4, H3]
  for (const u of g18Members) await applyAndApprove(H2, g18.id, u, 'Microsoft 365')
  const g18ConvId = await lockGroup(H2, g18.id, g18Members, 'Microsoft 365')
  for (const u of g18Members) {
    const memberId = await getMemberId(H2, g18.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(H2, g18.id, g18Members, g18ConvId, 'Microsoft 365')
  for (const u of g18Members) await api('POST', `/groups/${g18.id}/confirm`, u.token)
  await api('POST', `/groups/${g18.id}/renew`, H2.token) // active → pending_confirmation，第二期代管扣款、清空帳號資訊
  for (const u of g18Members) await notify(H2, u.id, 'group_renewal', '新一期訂閱開始', 'Microsoft 365 群組已開始新一期收款，請重新填寫服務帳號資訊', { groupId: g18.id })
  console.log('G18 pending_confirmation（Microsoft 365，已跑完第 1 期並開始續訂第 2 期）')

  // ── G19 active：demo9 主揪 Dropbox（Family 6 人），申訴後管理員裁定「成員獲勝」+ 2 則評價 ──
  const g19 = await createGroup(H3, { serviceId: 'dropbox', planId: 'dropbox-family', maxMembers: 6 })
  const g19Members = [D1, D2, D3, D4, H2]
  for (const u of g19Members) await applyAndApprove(H3, g19.id, u, 'Dropbox')
  const g19ConvId = await lockGroup(H3, g19.id, g19Members, 'Dropbox')
  for (const u of g19Members) {
    const memberId = await getMemberId(H3, g19.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(H3, g19.id, g19Members, g19ConvId, 'Dropbox')
  await api('POST', `/groups/${g19.id}/dispute`, D2.token, { reason: '帳號被收回，登入不進去' })
  await notify(D2, H3.id, 'dispute_raised', '收到成員問題回報', '林小美 針對 Dropbox 服務提出回報問題，將於 48 小時內處理完成', { groupId: g19.id })
  await api('POST', `/groups/${g19.id}/adjudicate`, ADMIN.token, { winner: 'member', reason: '經查證團主確實未提供正確帳號，退款給申訴成員' })
  await api('POST', '/reviews', D1.token, { groupId: g19.id, rating: 3, comment: '中間有點小狀況，但申訴後平台有妥善處理。' })
  await api('POST', '/reviews', D4.token, { groupId: g19.id, rating: 5, comment: '我這邊都沒遇到問題，運作正常。' })
  console.log('G19 active（Dropbox，申訴後管理員裁定成員獲勝，demo2 已退款離開）')

  // ── G20 active：demo7 主揪 NordVPN，申訴後管理員裁定「團主獲勝」+ 2 則評價 ──
  const g20 = await createGroup(H1, { serviceId: 'nordvpn', planId: 'nordvpn-basic', maxMembers: 3 })
  await applyAndApprove(H1, g20.id, D3, 'NordVPN')
  await applyAndApprove(H1, g20.id, D5, 'NordVPN')
  const g20ConvId = await lockGroup(H1, g20.id, [D3, D5], 'NordVPN')
  for (const u of [D3, D5]) {
    const memberId = await getMemberId(H1, g20.id, u.id)
    await fillInfo(u, memberId, { acknowledged: true })
  }
  await activateGroup(H1, g20.id, [D3, D5], g20ConvId, 'NordVPN')
  await api('POST', `/groups/${g20.id}/dispute`, D5.token, { reason: '覺得速度跟描述不符' })
  await notify(D5, H1.id, 'dispute_raised', '收到成員問題回報', '李冠宇 針對 NordVPN 服務提出回報問題，將於 48 小時內處理完成', { groupId: g20.id })
  await api('POST', `/groups/${g20.id}/adjudicate`, ADMIN.token, { winner: 'host', reason: '經查證服務正常，維持原訂閱' })
  await api('POST', '/reviews', D3.token, { groupId: g20.id, rating: 4, comment: '服務穩定，速度也不錯。' })
  await api('POST', '/reviews', D5.token, { groupId: g20.id, rating: 5, comment: '申訴後團主還是很有耐心解釋，後續也沒問題了。' })
  console.log('G20 active（NordVPN，申訴後管理員裁定團主獲勝）')

  // ── 系統公告（透過管理員帳號的真實廣播 API）───────────────────────────
  await api('POST', '/system-messages/broadcast', ADMIN.token, {
    content: 'PartyMatch 將於本週六凌晨 2:00-4:00 進行例行維護，期間服務可能短暫中斷',
  })
  console.log('已發送系統公告')

  // ── DM 私訊：demo7 主動聯繫 demo8 ────────────────────────────────────
  const dm = await api('POST', '/conversations/dm', H1.token, { targetUserId: H2.id })
  await api('POST', `/conversations/${dm.id}/messages`, H1.token, { content: '嗨，想請問 Spotify 群組還有名額嗎？' })
  await api('POST', `/conversations/${dm.id}/messages`, H2.token, { content: '目前剛好滿囉，不好意思！之後有名額會再通知你' })
  console.log('已建立 demo7 → demo8 的 DM 私訊')

  // ── 付款方式 ──────────────────────────────────────────────────────────
  await api('POST', '/payment-methods', H1.token, { brand: 'Visa', last4: '4242', expiry: '12/28' })
  await api('POST', '/payment-methods', H1.token, { brand: 'Mastercard', last4: '5588', expiry: '06/27' })
  await api('POST', '/payment-methods', D1.token, { brand: 'Visa', last4: '1234', expiry: '09/26' })
  console.log('已建立付款方式')

  console.log('\ndemo 資料建立完成！共 10 個帳號、22 個群組，密碼皆為: Demo1234')
  console.log('  demo7～demo9：團主帳號　demo1～demo6：一般成員帳號　demo-admin：管理員帳號')
}

main()
  .catch(err => { console.error('建立 demo 資料失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
