// 依服務的 sharingMethod 決定「填寫服務帳號資訊」表單要收哪些欄位，
// 對應 docs/product/service-info-requirements.md 調查的 6 種共享機制分類。
export const SHARING_METHOD_CONFIG = {
  apple_family: {
    fields: [
      { key: 'appleId', label: 'Apple ID', type: 'email', placeholder: 'example@icloud.com' },
    ],
    notice: '此服務透過 Apple「家庭共享」加入，團主會把你的 Apple ID 加進家庭群組。加入後會一併共用 App Store 購買紀錄等項目，且家庭群組成員一年僅能異動一次，請確認後再提供。',
  },
  google_family: {
    fields: [
      { key: 'googleEmail', label: 'Google 帳戶 Email', type: 'email', placeholder: 'example@gmail.com' },
    ],
    notice: '此服務透過 Google 家庭群組加入，加入後會一併共用 Google Play 家庭媒體庫等項目，且家庭群組成員一年僅能異動一次，請確認後再提供。',
  },
  email_invite: {
    fields: [
      { key: 'email', label: '帳號 Email', type: 'email', placeholder: 'example@gmail.com' },
    ],
    notice: null,
  },
  email_invite_with_address: {
    fields: [
      { key: 'email', label: '帳號 Email', type: 'email', placeholder: 'example@gmail.com' },
      { key: 'address', label: '居住地址', type: 'text', placeholder: '需與團主開通方案時填寫的地址完全一致' },
    ],
    notice: '此服務需要地址驗證才能加入家庭方案，請向團主確認開通時填寫的地址格式（含標點、大小寫），驗證地址須完全一致才能加入成功。',
  },
  invite_code: {
    fields: [
      { key: 'inviteCode', label: '邀請碼', type: 'text', placeholder: '請先在服務 App 內產生邀請碼' },
    ],
    notice: '此服務的綁定方向相反：請先用你自己的帳號登入該服務 App，在「共享帳號管理」頁面產生邀請碼，再把邀請碼填在這裡交給團主完成綁定。',
  },
  shared_credentials: {
    fields: [
      { key: 'acknowledged', label: '我已取得帳號密碼並確認可以登入', type: 'checkbox' },
    ],
    notice: '此服務官方沒有多人邀請功能，帳號密碼由團主在鎖定群組時統一提供，見下方「團主提供的帳號資訊」；確認可以登入後再勾選下方確認框。',
  },
}

const DEFAULT_METHOD = 'email_invite'

export function getSharingMethodConfig(sharingMethod) {
  return SHARING_METHOD_CONFIG[sharingMethod] ?? SHARING_METHOD_CONFIG[DEFAULT_METHOD]
}

// 判斷 Member.serviceInfo 是否已經算「填寫完成」：只要必填欄位都有值即可，
// 不同 sharingMethod 的欄位組合不同，不能寫死檢查 .email
export function hasFilledServiceInfo(serviceInfo, sharingMethod) {
  if (!serviceInfo) return false
  const { fields } = getSharingMethodConfig(sharingMethod)
  return fields.every(({ key, type }) => {
    const value = serviceInfo[key]
    return type === 'checkbox' ? value === true : !!value?.toString().trim()
  })
}

// 該 sharingMethod 裡「有文字內容」的欄位（排除 checkbox），給摘要／明細顯示共用
export function getTextFields(sharingMethod) {
  return getSharingMethodConfig(sharingMethod).fields.filter(({ type }) => type !== 'checkbox')
}

// 給聊天室訊息卡片、團主審核清單等處顯示用的單行摘要
export function getServiceInfoSummary(serviceInfo, sharingMethod) {
  if (!serviceInfo) return null
  const parts = getTextFields(sharingMethod)
    .map(({ key, label }) => serviceInfo[key] ? `${label}：${serviceInfo[key]}` : null)
    .filter(Boolean)
  if (parts.length > 0) return parts.join('　')
  // 只有 checkbox 欄位（例如 shared_credentials）沒有文字可顯示時，回報已確認
  const { fields } = getSharingMethodConfig(sharingMethod)
  return fields.some(({ key, type }) => type === 'checkbox' && serviceInfo[key]) ? '已確認取得帳號資訊' : null
}
