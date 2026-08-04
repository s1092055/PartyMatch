export const LOCKED_MESSAGE = '請先登入會員'

// /account 不在這裡——未登入也能進帳號頁，只是頁面內個人化資料/操作各自處理鎖定提示
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
