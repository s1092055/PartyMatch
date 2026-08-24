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

export const PROTECTED_NAV_ROUTES = new Set([
  '/my-subscriptions',
  '/manage-groups',
  '/favorites',
]);

export function getNavItemKey(item) {
  return item.to ?? item.type
}

export function isProtectedNavItem(item) {
  return item.type === 'create' || PROTECTED_NAV_ROUTES.has(item.to)
}
