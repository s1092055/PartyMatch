const ACCOUNT_FIELD  = { key: 'account', label: '帳號 / Email', placeholder: 'example@gmail.com' };
const PASSWORD_FIELD = { key: 'password', label: '密碼', placeholder: '請輸入密碼' }
const PROFILE_FIELD  = { key: 'profileName', label: '團主指定使用的 Profile 名稱', placeholder: '請填寫自己要使用的 Profile，避免其他成員互相影響使用體驗' }
const DEVICE_FIELD    = { key: 'deviceSlots', label: '可用裝置登入名額', placeholder: '此服務的名額上限是裝置數而非人數，請說明可用的裝置配額' }
const DISCORD_FIELD   = { key: 'discordInviteUrl', label: 'Discord 邀請連結', placeholder: 'https://discord.gg/xxxx' }

const COMMON_FIELDS = [ACCOUNT_FIELD, PASSWORD_FIELD]

export const CREDENTIAL_RISK_NOTICE = '帳號密碼一經提供，你將無法再控制對方後續如何使用（是否截圖轉傳、私下再分享給他人等），此風險平台無法在技術上完全防範。建議先參考對方的信用分數與評價紀錄再決定是否提供，並在對方退出或群組結束後盡快更改密碼。';

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
