import 'dotenv/config';
import prisma from '../src/lib/prisma.js'
import { SERVICES } from '../../src/common/data/serviceCatalog.js'

const BASE = process.env.SEED_API_BASE ?? `http://localhost:${process.env.PORT ?? 3001}/api`
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo1234';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEMO_PASSWORD

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
  await api('POST', '/tokens/topup', user.token, { amount });
}

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

async function lockGroup(hostUser, groupId) {
  const conv = await api('POST', '/conversations/group', hostUser.token, { groupId })
  await api('POST', `/groups/${groupId}/lock`, hostUser.token)
  return conv.id
}

async function activateGroup(hostUser, groupId, convId, serviceName) {
  await api('POST', `/groups/${groupId}/activate`, hostUser.token)
  await sendSystemMessage(hostUser, convId, `${serviceName} 服務已啟用！請在 48 小時內確認服務是否正常運作。`)
}

async function sendMessage(user, convId, content) {
  return api('POST', `/conversations/${convId}/messages`, user.token, { content })
}

async function sendSystemMessage(user, convId, content) {
  return api('POST', `/conversations/${convId}/messages`, user.token, { content, type: 'system' })
}

async function addCredentialComment(user, groupId, content, attachmentUrl) {
  return api('POST', '/credential-comments', user.token, { groupId, content, attachmentUrl })
}

let SERVICE_MAP = null;
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

  // 每個團主帳號只對應一個群組/一個流程情境，帳號名稱本身就講清楚用途——
  // 登入哪個帳號就只看到那一個情境，不會被其他無關群組混淆
  const H_recruiting  = await registerUser({ email: 'demo-recruiting@partymatch.test',  name: '團主·招募中',   phone: '+886911000011' });
  const H_full        = await registerUser({ email: 'demo-full@partymatch.test',        name: '團主·已滿員',   phone: '+886911000012' });
  const H_fillinfo    = await registerUser({ email: 'demo-fillinfo@partymatch.test',    name: '團主·待填資訊', phone: '+886911000013' });
  const H_confirming  = await registerUser({ email: 'demo-confirming@partymatch.test',  name: '團主·確認期中', phone: '+886911000014' });
  const H_removed     = await registerUser({ email: 'demo-removed@partymatch.test',     name: '團主·曾移除成員', phone: '+886911000015' });
  const H_activation  = await registerUser({ email: 'demo-activation@partymatch.test',  name: '團主·待啟用',   phone: '+886911000016' });
  const H_dispute     = await registerUser({ email: 'demo-dispute@partymatch.test',     name: '團主·申訴中',   phone: '+886911000017' });
  const H_active      = await registerUser({ email: 'demo-active@partymatch.test',      name: '團主·服務中',   phone: '+886911000018' });
  const H_cancelled   = await registerUser({ email: 'demo-cancelled@partymatch.test',   name: '團主·已解散',   phone: '+886911000019' });
  const H_renewal     = await registerUser({ email: 'demo-renewal@partymatch.test',     name: '團主·續訂中',   phone: '+886911000020' });

  const M1 = await registerUser({ email: 'demo-member1@partymatch.test', name: '成員·王小明', phone: '+886911000021' })
  const M2 = await registerUser({ email: 'demo-member2@partymatch.test', name: '成員·林小美', phone: '+886911000022' })
  const M3 = await registerUser({ email: 'demo-member3@partymatch.test', name: '成員·陳大文', phone: '+886911000023' })

  const ADMIN = await registerUser({ email: 'demo-admin@partymatch.test', name: '平台管理員', phone: '+886911000099', password: ADMIN_PASSWORD })
  await prisma.user.update({ where: { id: ADMIN.id }, data: { isAdmin: true } });
  console.log('已註冊 14 個帳號（10 個團主，各自對應一個流程情境；3 個共用成員；1 個管理員）')

  const hosts = [H_recruiting, H_full, H_fillinfo, H_confirming, H_removed, H_activation, H_dispute, H_active, H_cancelled, H_renewal]
  for (const h of hosts) await topup(h, 500)
  for (const m of [M1, M2, M3]) await topup(m, 5000)
  console.log('已完成PM幣儲值\n')

  // demo-recruiting：招募中，含待審/已拒絕申請、信用分數門檻、團主手動加入成員
  const gRecruiting = await createGroup(H_recruiting, { serviceId: 'netflix', planId: 'netflix-4k', maxMembers: 4, minCreditScore: 60 });
  await api('POST', '/applications', M1.token, { groupId: gRecruiting.id, message: '想加入！平常都用 Netflix 追劇，穩定準時繳費 🙏' })
  const rejectedApp = await api('POST', '/applications', M2.token, { groupId: gRecruiting.id, message: '可以加入嗎？' })
  await api('PATCH', `/applications/${rejectedApp.id}`, H_recruiting.token, { status: 'rejected' })
  await api('POST', '/members', H_recruiting.token, { groupId: gRecruiting.id, userId: M3.id })
  console.log('demo-recruiting：recruiting（Netflix 4K，1 筆待審＋1 筆已拒絕申請、minCreditScore 門檻、團主已手動加入 1 位成員，仍有空位）')

  // demo-full：滿員，示範「申請→核准→中途退出→遞補回滿員」
  const gFull = await createGroup(H_full, { serviceId: 'spotify', planId: 'spotify-duo', maxMembers: 2 });
  const leftAppId = await applyAndApprove(H_full, gFull.id, M1, 'Spotify Duo，跟室友分攤')
  const leftMemberId = await getMemberId(H_full, gFull.id, M1.id)
  await api('DELETE', `/members/${leftMemberId}`, M1.token);
  await applyAndApprove(H_full, gFull.id, M2, 'Spotify Duo，想找人一起訂閱')
  console.log('demo-full：full（Spotify Duo，M1 申請核准後中途自行退出，M2 遞補回滿員）')
  void leftAppId

  // demo-fillinfo：待填服務資訊，shared_credentials 方式，含帳號資訊留言區圖片附件
  const gFillInfo = await createGroup(H_fillinfo, { serviceId: 'disney', planId: 'disney-std-monthly', maxMembers: 2 });
  await applyAndApprove(H_fillinfo, gFillInfo.id, M1, 'Disney+，想看漫威跟皮克斯')
  await lockGroup(H_fillinfo, gFillInfo.id)
  await addCredentialComment(H_fillinfo, gFillInfo.id, '帳號密碼正在設定中，晚點補上，先附上訂閱成立的截圖給大家確認', 'https://picsum.photos/seed/credential-attachment/600/400');
  console.log('demo-fillinfo：pending_confirmation（Disney+，shared_credentials，剛鎖定成員尚未填寫；帳號資訊留言區已示範圖片附件）')

  // demo-confirming：確認期中，部分成員已確認
  const gConfirming = await createGroup(H_confirming, { serviceId: 'hbo', planId: 'hbo-std-monthly', maxMembers: 3 });
  const confirmingMembers = [M1, M2]
  for (const u of confirmingMembers) await applyAndApprove(H_confirming, gConfirming.id, u, 'HBO Max')
  const gConfirmingConvId = await lockGroup(H_confirming, gConfirming.id)
  for (const u of confirmingMembers) {
    const memberId = await getMemberId(H_confirming, gConfirming.id, u.id)
    await fillInfo(u, memberId, { email: u.email })
  }
  await activateGroup(H_confirming, gConfirming.id, gConfirmingConvId, 'HBO Max')
  await api('POST', `/groups/${gConfirming.id}/confirm`, M1.token)
  console.log('demo-confirming：confirming（HBO Max，M1 已確認、M2 尚未確認）')

  // demo-removed：成員曾被移除，示範信用分數 -10
  const gRemoved = await createGroup(H_removed, { serviceId: 'kkbox', planId: 'kkbox-3', maxMembers: 3 });
  await applyAndApprove(H_removed, gRemoved.id, M3, 'KKBOX')
  const removedMemberId = await getMemberId(H_removed, gRemoved.id, M3.id)
  await api('DELETE', `/members/${removedMemberId}`, H_removed.token);
  console.log('demo-removed：recruiting（KKBOX，M3 被團主移除並自動扣 10 分信用分數，群組退回 0 人）')

  // demo-activation：待啟用，全員已填完（Crunchyroll 4 人方案：host + 3 位成員才會滿員，剛好用滿共用成員池）
  const gActivation = await createGroup(H_activation, { serviceId: 'crunchyroll', planId: 'crunchyroll-mega', maxMembers: 4 });
  const activationMembers = [M1, M2, M3]
  for (const u of activationMembers) await applyAndApprove(H_activation, gActivation.id, u, 'Crunchyroll')
  await lockGroup(H_activation, gActivation.id)
  for (const u of activationMembers) {
    const memberId = await getMemberId(H_activation, gActivation.id, u.id)
    await fillInfo(u, memberId, { acknowledged: true })
  }
  console.log('demo-activation：pending_activation（Crunchyroll，shared_credentials，全員已填完帳號，待團主啟用）')

  // demo-dispute：申訴中，刻意不預先解決（Claude Pro 2 人方案：host + 1 位成員即可滿員）
  const gDispute = await createGroup(H_dispute, { serviceId: 'claude', planId: 'claude-pro', maxMembers: 2 });
  await applyAndApprove(H_dispute, gDispute.id, M3, 'Claude Pro')
  const gDisputeConvId = await lockGroup(H_dispute, gDispute.id)
  const disputeMemberId = await getMemberId(H_dispute, gDispute.id, M3.id)
  await fillInfo(M3, disputeMemberId, { acknowledged: true })
  await activateGroup(H_dispute, gDispute.id, gDisputeConvId, 'Claude Pro')
  await api('POST', `/groups/${gDispute.id}/dispute`, M3.token, {
    reason: '帳號一直登入不進去，密碼好像被改過了', evidenceUrl: 'https://picsum.photos/seed/dispute1/600/400',
  })
  await sendMessage(M3, gDisputeConvId, '帳號登入不進去，我已經回報問題了')
  console.log('demo-dispute：disputed（Claude Pro，M3 申訴中，尚未處理——留給測試者現場示範自行解決或管理員裁定任一路徑）')

  // demo-active：服務中，示範雙向互評與信用分數連動
  const gActive = await createGroup(H_active, { serviceId: 'chatgpt', planId: 'chatgpt-team-monthly', maxMembers: 2 });
  await applyAndApprove(H_active, gActive.id, M1, 'ChatGPT Team')
  const gActiveConvId = await lockGroup(H_active, gActive.id)
  const activeMemberId = await getMemberId(H_active, gActive.id, M1.id)
  await fillInfo(M1, activeMemberId, { email: M1.email })
  await activateGroup(H_active, gActive.id, gActiveConvId, 'ChatGPT Team')
  await api('POST', `/groups/${gActive.id}/confirm`, M1.token)
  await api('POST', '/reviews', M1.token, { groupId: gActive.id, revieweeId: H_active.id, rating: 5, comment: '團主人很好，服務很快就設定好了！' })
  await api('POST', '/reviews', H_active.token, { groupId: gActive.id, revieweeId: M1.id, rating: 4, comment: '準時繳費、配合度很高，謝謝！' })
  console.log('demo-active：active（ChatGPT Team，成員確認撥款完成，示範雙向互評：成員評團主 5★、團主評成員 4★）')

  // demo-cancelled：招募中解散
  const gCancelled = await createGroup(H_cancelled, { serviceId: 'discord', planId: 'discord-family-monthly', maxMembers: 5 });
  await api('POST', '/applications', M2.token, { groupId: gCancelled.id, message: '想加入！' })
  await api('POST', `/groups/${gCancelled.id}/cancel`, H_cancelled.token)
  console.log('demo-cancelled：cancelled（Discord，招募中解散，M2 的待審申請全額退款）')

  // demo-renewal：已跑完第 1 期，續訂進入第 2 期
  const gRenewal = await createGroup(H_renewal, { serviceId: 'midjourney', planId: 'midjourney-std-monthly', maxMembers: 3 });
  const renewalMembers = [M1, M2]
  for (const u of renewalMembers) await applyAndApprove(H_renewal, gRenewal.id, u, 'Midjourney')
  const gRenewalConvId = await lockGroup(H_renewal, gRenewal.id)
  for (const u of renewalMembers) {
    const memberId = await getMemberId(H_renewal, gRenewal.id, u.id)
    await fillInfo(u, memberId, { acknowledged: true })
  }
  await activateGroup(H_renewal, gRenewal.id, gRenewalConvId, 'Midjourney')
  for (const u of renewalMembers) await api('POST', `/groups/${gRenewal.id}/confirm`, u.token)
  await api('POST', `/groups/${gRenewal.id}/renew`, H_renewal.token);
  console.log('demo-renewal：pending_confirmation（Midjourney，已完整跑完第 1 期並開始續訂第 2 期，帳號資訊已清空重新等待填寫）')

  await api('POST', '/system-messages/broadcast', ADMIN.token, {
    content: 'PartyMatch 將於本週六凌晨 2:00-4:00 進行例行維護，期間服務可能短暫中斷',
  });
  console.log('已發送系統公告')

  const dm = await api('POST', '/conversations/dm', H_recruiting.token, { targetUserId: H_full.id });
  await api('POST', `/conversations/${dm.id}/messages`, H_recruiting.token, { content: '嗨，想請問你的 Spotify 群組還有名額嗎？' })
  await api('POST', `/conversations/${dm.id}/messages`, H_full.token, { content: '目前剛好滿囉，不好意思！之後有名額會再通知你' })
  await api('POST', `/conversations/${dm.id}/messages`, H_recruiting.token, { content: '好的，附上我截的名額狀態給你參考', attachmentUrl: 'https://picsum.photos/seed/dm-attachment/600/400' })
  console.log('已建立 demo-recruiting → demo-full 的 DM 私訊（含圖片附件示範）')

  const allUsers = [...hosts, M1, M2, M3, ADMIN];
  await Promise.all(allUsers.map(u => api('PATCH', '/notifications/read-all', u.token)))
  await prisma.conversation.updateMany({ data: { unreadCounts: {} } });
  console.log('已將所有通知與訊息標記為已讀')

  console.log(`\ndemo 資料建立完成！共 14 個帳號、10 個群組，一個帳號對應一個流程情境。密碼皆為: ${DEMO_PASSWORD}；demo-admin ${process.env.ADMIN_PASSWORD ? '使用 ADMIN_PASSWORD 環境變數設定的密碼' : `密碼同上（未設定 ADMIN_PASSWORD）: ${DEMO_PASSWORD}`}`)
  console.log('  想測哪個流程，登入對應名稱的帳號即可（例如想測申訴流程就登入 demo-dispute），畫面乾淨不會混到其他情境')
}

main()
  .catch(err => { console.error('建立 demo 資料失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
