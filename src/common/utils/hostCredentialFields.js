// 官方無多人邀請機制的服務（sharingMethod: shared_credentials），鎖定群組時團主要提供的
// 結構化帳號資訊欄位；依 docs/product/service-info-requirements.md 的調查結果分服務設定，
// 取代原本讓團主自由輸入一段文字的 textarea。
const ACCOUNT_FIELD  = { key: 'account', label: '帳號 / Email', placeholder: 'example@gmail.com' }
const PASSWORD_FIELD = { key: 'password', label: '密碼', placeholder: '請輸入密碼' }
const PROFILE_FIELD  = { key: 'profileName', label: '團主指定使用的 Profile 名稱', placeholder: '請填寫自己要使用的 Profile，避免其他成員互相影響使用體驗' }
const DEVICE_FIELD    = { key: 'deviceSlots', label: '可用裝置登入名額', placeholder: '此服務的名額上限是裝置數而非人數，請說明可用的裝置配額' }
const DISCORD_FIELD   = { key: 'discordInviteUrl', label: 'Discord 邀請連結', placeholder: 'https://discord.gg/xxxx' }

const COMMON_FIELDS = [ACCOUNT_FIELD, PASSWORD_FIELD]

// 帳密一旦交出去，團主就無法再控制對方後續怎麼使用；這個風險沒辦法靠平台技術完全避免，
// 這 10 個服務都適用，跟各自服務條款無關的部分另外用 warning 補充（例如 Adobe 的授權條款）
export const CREDENTIAL_RISK_NOTICE = '帳號密碼一經提供，你將無法再控制對方後續如何使用（是否截圖轉傳、私下再分享給他人等），此風險平台無法在技術上完全防範。建議先參考對方的信用分數與評價紀錄再決定是否提供，並在對方退出或群組結束後盡快更改密碼。'

export const HOST_CREDENTIAL_FIELDS = {
  netflix:     { fields: [...COMMON_FIELDS, PROFILE_FIELD] },
  disney:      { fields: [...COMMON_FIELDS, PROFILE_FIELD] },
  hbo:         { fields: [...COMMON_FIELDS, PROFILE_FIELD] },
  crunchyroll: { fields: [...COMMON_FIELDS, PROFILE_FIELD] },
  discord:     { fields: COMMON_FIELDS },
  claude:      { fields: COMMON_FIELDS },
  midjourney:  { fields: [...COMMON_FIELDS, DISCORD_FIELD] },
  'adobe-cc':  {
    fields: COMMON_FIELDS,
    warning: 'Adobe 個人版方案的使用條款不允許帳號共用，提供帳密給他人使用可能違反 Adobe 服務條款，請自行評估風險。',
  },
  nordvpn:    { fields: [...COMMON_FIELDS, DEVICE_FIELD] },
  expressvpn: { fields: [...COMMON_FIELDS, DEVICE_FIELD] },
}

export function getHostCredentialFields(serviceId) {
  return HOST_CREDENTIAL_FIELDS[serviceId] ?? { fields: COMMON_FIELDS }
}

// group.sharedCredentials 存的是 JSON.stringify 過的欄位物件；改版前建立的群組裡這欄位
// 還是團主自由輸入的純文字，JSON.parse 會丟錯，這時 fallback 回傳 null 讓呼叫端照舊顯示原始文字
export function parseHostCredentials(sharedCredentials, serviceId) {
  if (!sharedCredentials) return null
  let data
  try {
    data = JSON.parse(sharedCredentials)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const { fields } = getHostCredentialFields(serviceId)
  const entries = fields.map(({ key, label }) => ({ key, label, value: data[key] })).filter(({ value }) => !!value)
  return entries.length > 0 ? entries : null
}
