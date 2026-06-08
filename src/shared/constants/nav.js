import { Compass, CreditCard, Heart, LayoutGrid, MessageSquare, PlusCircle, User, Zap } from 'lucide-react'

export const NAV_SECTIONS = [
  {
    label: '探索',
    items: [
      { to: '/explore',     label: '探索群組', icon: Compass },
      { type: 'search',     label: '搜尋' },
      { type: 'match',       label: '快速配對', icon: Zap },
    ],
  },
  {
    label: '我的帳號',
    items: [
      { to: '/my-subscriptions', label: '我的訂閱',  icon: CreditCard },
      { to: '/favorites',        label: '我的收藏',  icon: Heart },
      { type: 'messages',        label: '訊息中心',  icon: MessageSquare },
      { to: '/account',          label: '帳號中心',  icon: User },
    ],
  },
  {
    label: '團主專區',
    items: [
      { to: '/manage-groups', label: '群組管理', icon: LayoutGrid },
      { type: 'create',       label: '建立群組', icon: PlusCircle },
    ],
  },
]
