import { Compass, Heart, LayoutDashboard, PlusCircle, Search, Wallet } from 'lucide-react'

// NAV_SECTIONS 的「我的帳號」區段直接讀這份清單，跟桌面版 DesktopSidebar／
// TabletSidebarDrawer 共用同一份 icon/文案/路由，改標籤或加項目只需要動這裡
export const MY_NAV_ITEMS = [
  { to: '/manage-groups',    label: '群組管理', icon: LayoutDashboard },
  { to: '/my-subscriptions', label: '我的訂閱', icon: Wallet },
  { to: '/favorites',        label: '我的收藏', icon: Heart },
]

export const NAV_SECTIONS = [
  {
    label: '探索',
    items: [
      { to: '/explore',  label: '探索群組', icon: Compass },
      { type: 'match',   label: '快速搜尋', icon: Search },
      { type: 'create',  label: '建立群組', icon: PlusCircle },
    ],
  },
  {
    label: '我的帳號',
    items: MY_NAV_ITEMS,
  },
]
