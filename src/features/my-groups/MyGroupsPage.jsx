import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Archive, ArrowLeftRight, Crown, Users } from 'lucide-react'
import MemberPage from './member/MemberPage'
import HostPage from './host/HostPage'

const TABS = [
  { key: 'member', label: '我是成員', icon: Users },
  { key: 'host',   label: '我是團主', icon: Crown },
]

export default function MyGroupsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeView = searchParams.get('view') || 'member'

  const currentTab = TABS.find(tab => tab.key === activeView) ?? TABS[0]
  const CurrentIcon = currentTab.icon
  const [historyOpen, setHistoryOpen] = useState(false)

  function switchTab(view) {
    setHistoryOpen(false) // 兩個身分共用同一顆群組紀錄 modal，切換身分時要先關掉，不然另一邊會帶著開啟狀態掛載
    navigate(`/my-groups?view=${view}`, { replace: true })
  }

  function toggleTab() {
    switchTab(activeView === 'host' ? 'member' : 'host')
  }

  return (
    <div>
      {/* 標題在左側；「群組紀錄」「切換身份」兩顆按鈕放在最右側，群組紀錄在切換身份左邊 */}
      <div className="mb-6 flex items-center justify-between px-2 md:px-4 lg:px-16">
        <h2 className="flex items-center gap-2 text-xl font-black text-ink">
          <CurrentIcon size={20} strokeWidth={1.5} className="text-brand" />
          {currentTab.label}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            aria-label="群組紀錄"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
          >
            <Archive size={14} strokeWidth={1.5} />
            群組紀錄
          </button>
          <button
            onClick={toggleTab}
            aria-label="切換身份"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
          >
            <ArrowLeftRight size={14} strokeWidth={1.5} />
            切換身份
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'host'
        ? <HostPage embedded historyOpen={historyOpen} onCloseHistory={() => setHistoryOpen(false)} />
        : <MemberPage embedded historyOpen={historyOpen} onCloseHistory={() => setHistoryOpen(false)} />
      }
    </div>
  )
}
