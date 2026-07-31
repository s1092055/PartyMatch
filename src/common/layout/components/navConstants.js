export const LOCKED_MESSAGE = '請先登入會員'

export const PROTECTED_NAV_ROUTES = new Set([
  '/my-subscriptions',
  '/manage-groups',
  '/favorites',
  '/account',
])

export function getNavItemKey(item) {
  return item.to ?? item.type
}

export function isProtectedNavItem(item) {
  return item.type === 'create' || PROTECTED_NAV_ROUTES.has(item.to)
}
