export const LOCKED_MESSAGE = '請先登入會員'

export const PRESENCE_LABELS = {
  online:  '在線中',
  busy:    '忙碌中',
  offline: '已離線',
}

export const PRESENCE_COLORS = {
  online:  'bg-emerald-500',
  busy:    'bg-amber-500',
  offline: 'bg-red-500',
}

// 個人資料／信用分數／我的評價不在這裡——它們不是透過 NAV_SECTIONS 這條 hover-lock
// 提示的路徑渲染，而是 sidebar/header 底部使用者資訊 dropdown-menu 裡的項目，這個
// dropdown 本身只在已登入時才會出現（未登入顯示的是直接連到 /login 的連結），
// 不需要再套一層鎖定提示
export const PROTECTED_NAV_ROUTES = new Set([
  '/my-subscriptions',
  '/manage-groups',
  '/favorites',
])

export function getNavItemKey(item) {
  return item.to ?? item.type
}

export function isProtectedNavItem(item) {
  return item.type === 'create' || PROTECTED_NAV_ROUTES.has(item.to)
}
