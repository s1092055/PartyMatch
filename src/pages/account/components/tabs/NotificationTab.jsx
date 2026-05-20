import { useState } from 'react'
import Toggle from '../../../../shared/components/ui/Toggle'

const NOTIFICATION_GROUPS = [
  {
    group: '訂閱與付款',
    items: [
      { id: 'renewal',  label: '續訂提醒',     desc: '訂閱到期前 7 天與 3 天提醒',   default: true },
      { id: 'payment',  label: '付款提醒',     desc: '扣款日前通知你確認付款狀態',     default: true },
      { id: 'overdue',  label: '逾期通知',     desc: '付款逾期時立即通知',            default: true },
    ],
  },
  {
    group: '申請與群組',
    items: [
      { id: 'apply_result', label: '申請結果',    desc: '申請核准或拒絕時通知',    default: true },
      { id: 'new_apply',    label: '新申請通知',  desc: '有人申請加入你的群組',    default: true },
      { id: 'member_join',  label: '成員加入',    desc: '新成員加入群組時通知',    default: false },
    ],
  },
  {
    group: '系統通知',
    items: [
      { id: 'news',    label: '平台公告',   desc: '重要系統更新與新功能公告', default: false },
      { id: 'promo',   label: '優惠活動',   desc: '限時優惠與特別活動通知',   default: false },
    ],
  },
]

export default function NotificationTab() {
  const [prefs, setPrefs] = useState(() =>
    Object.fromEntries(
      NOTIFICATION_GROUPS.flatMap(g => g.items).map(i => [i.id, i.default])
    )
  )

  function toggle(id) {
    setPrefs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-4">
      {NOTIFICATION_GROUPS.map(({ group, items }) => (
        <div key={group} className="card overflow-hidden">
          <div className="px-5 py-3 bg-raised border-b border-line-subtle">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">{group}</p>
          </div>
          <div className="divide-y divide-line-subtle">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-2">{item.label}</p>
                  <p className="text-xs text-ink-3 mt-0.5">{item.desc}</p>
                </div>
                <Toggle checked={prefs[item.id]} onChange={() => toggle(item.id)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
