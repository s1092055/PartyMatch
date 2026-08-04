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

// /account 不在這裡——它不是透過 NAV_SECTIONS 這條 hover-lock 提示的路徑渲染，
// 而是 sidebar/header 底部單獨處理的使用者資訊按鈕，未登入時本身就已經直接連到
// /login，不需要再套一層鎖定提示；登入保護則交給 router.jsx 的 ProtectedRoute
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
