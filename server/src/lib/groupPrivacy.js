import { getSignedDownloadUrl } from './r2Storage.js'

// Group.sharedCredentials（團主提供的共用帳密）跟 Member.serviceInfo／serviceInfoIssueNote／
// serviceInfoIssueEvidenceUrl／disputeEvidenceUrl（成員自己填寫的服務帳號、申訴證據）都是
// 只有「這個群組的團主或成員本人」才該看到的敏感資料。GET /groups、GET /groups/:id 用 Prisma
// 的 include 撈資料時，沒有另外用 select 限制欄位，會把這些欄位整包序列化回傳——對任何打這支
// 公開 API 的人（含未登入訪客）都會外洩。這裡統一在 res.json() 前做欄位遮罩，不要相信
// include 自動幫你限制欄位範圍。

// 群組列表（探索頁）：不管是不是自己的群組，清單卡片本來就不會顯示帳密，直接整批拿掉最安全，
// 不用逐筆查是否為團主/成員（那需要額外查詢，列表頁不值得為了這個欄位多付出成本）
export function maskGroupListSensitiveFields(groups) {
  return groups.map(g => ({ ...g, sharedCredentials: undefined }))
}

// 單一成員的敏感欄位遮罩：只有該成員本人或該群組團主看得到 serviceInfo 等欄位。
// 抽成獨立函式是因為這個判斷同時被「群組詳情內嵌的 members 陣列」（maskGroupDetailSensitiveFields）
// 跟「members.js 的 GET / 端點」兩個地方需要，避免各自重寫一次判斷邏輯導致互相drift。
export function maskMemberSensitiveFields(member, { isHost, isSelf }) {
  if (isHost || isSelf) return member
  return {
    ...member,
    serviceInfo: undefined,
    serviceInfoIssueNote: undefined,
    serviceInfoIssueEvidenceUrl: undefined,
    disputeEvidenceUrl: undefined,
  }
}

// serviceInfoIssueEvidenceUrl／disputeEvidenceUrl 存的是 R2 物件 key（見 r2Storage.js），不是
// 完整網址；要在遮罩「之後」才簽網址，只對倖存下來（沒被上面遮罩成 undefined）的欄位簽，
// 避免對根本不會送出去的欄位也白白呼叫一次 R2 簽章
export async function resolveMemberEvidenceUrls(member) {
  if (!member) return member
  const [serviceInfoIssueEvidenceUrl, disputeEvidenceUrl] = await Promise.all([
    member.serviceInfoIssueEvidenceUrl ? getSignedDownloadUrl(member.serviceInfoIssueEvidenceUrl) : member.serviceInfoIssueEvidenceUrl,
    member.disputeEvidenceUrl ? getSignedDownloadUrl(member.disputeEvidenceUrl) : member.disputeEvidenceUrl,
  ])
  return { ...member, serviceInfoIssueEvidenceUrl, disputeEvidenceUrl }
}

export async function resolveMembersEvidenceUrls(members) {
  return Promise.all(members.map(resolveMemberEvidenceUrls))
}

// 群組詳情：viewerId 是目前登入者（未登入則為 undefined/null）。
// - 團主：看得到 sharedCredentials 跟所有成員的 serviceInfo（審核用）
// - 一般成員：看得到 sharedCredentials（要用來使用服務），但只看得到自己的 serviceInfo，
//   看不到其他成員的（其他成員各自填寫的個人帳號不該互相看到）
// - 非團主非成員（含未登入訪客）：兩者都看不到
export function maskGroupDetailSensitiveFields(group, viewerId) {
  if (!group) return group
  const isHost = !!viewerId && group.hostId === viewerId
  const isMember = !!viewerId && Array.isArray(group.members) && group.members.some(m => m.userId === viewerId)
  const isParticipant = isHost || isMember

  const masked = { ...group }
  if (!isParticipant) masked.sharedCredentials = undefined

  if (Array.isArray(group.members)) {
    masked.members = group.members.map(m =>
      maskMemberSensitiveFields(m, { isHost, isSelf: m.userId === viewerId }))
  }
  return masked
}

// groups/crud.js 的 GET /:id 呼叫端用：masked 過的群組再簽一次成員附件網址，
// 呼叫順序一定要先 maskGroupDetailSensitiveFields 再呼叫這個，簽章才不會白簽在被遮罩掉的欄位上
export async function resolveGroupMemberEvidenceUrls(group) {
  if (!group || !Array.isArray(group.members)) return group
  return { ...group, members: await resolveMembersEvidenceUrls(group.members) }
}
