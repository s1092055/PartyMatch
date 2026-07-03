import { useNavigate, useSearchParams } from 'react-router-dom'
import { Crown, Users } from 'lucide-react'
import SubscriptionsPage from '../subscriptions/SubscriptionsPage'
import ManagePage from '../manage/ManagePage'

const TABS = [
  { key: 'member', label: '我是成員', icon: Users },
  { key: 'host',   label: '我是團主', icon: Crown },
]

export default function MyGroupsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeView = searchParams.get('view') || 'member'

  function switchTab(view) {
    navigate(`/my-groups?view=${view}`, { replace: true })
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="page-title">我的群組</h1>
      </div>
      {/* Tab switcher */}
      <div className="mb-6 flex gap-2 px-2 md:px-4 lg:px-16">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                activeView === tab.key
                  ? 'bg-brand text-white'
                  : 'text-ink-3 hover:bg-raised hover:text-ink'
              }`}
            >
              <Icon size={16} strokeWidth={2.1} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content - completely separate components, no logic mixing */}
      {activeView === 'host'
        ? <ManagePage embedded />
        : <SubscriptionsPage embedded />
      }
    </div>
  )
}
