import { Compass, Heart, LayoutGrid, PlusCircle, Zap } from 'lucide-react'

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
      { to: '/my-groups', label: '我的群組', icon: LayoutGrid },
      { to: '/favorites', label: '我的收藏', icon: Heart },
    ],
  },
  {
    label: '團主專區',
    items: [
      { type: 'create', label: '建立群組', icon: PlusCircle },
    ],
  },
]
