export const COUNTRY_CODES = [
  { code: '+886', label: '台灣' },
  { code: '+852', label: '香港' },
  { code: '+853', label: '澳門' },
  { code: '+86',  label: '中國' },
  { code: '+81',  label: '日本' },
  { code: '+82',  label: '韓國' },
  { code: '+65',  label: '新加坡' },
  { code: '+60',  label: '馬來西亞' },
  { code: '+1',   label: '美國／加拿大' },
  { code: '+44',  label: '英國' },
];

export const DEFAULT_COUNTRY_CODE = '+886'

export function toE164(countryCode, localNumber) {
  const digits = localNumber.replace(/\D/g, '').replace(/^0+/, '')
  return digits ? `${countryCode}${digits}` : ''
}

export function parsePhone(phone) {
  if (!phone) return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: '' }
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  const matched = sorted.find(c => phone.startsWith(c.code))
  if (matched) return { countryCode: matched.code, localNumber: phone.slice(matched.code.length) }
  return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: phone.replace(/^\+?886/, '').replace(/^\+/, '') };
}

export function formatPhoneDisplay(phone) {
  if (!phone) return ''
  const { countryCode, localNumber } = parsePhone(phone)
  return `${countryCode} ${localNumber}`
}
