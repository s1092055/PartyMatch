import { useNavigate, useSearchParams } from 'react-router-dom'
import { Crown, Users } from 'lucide-react'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useSubscriptionStore } from '../../shared/stores/useSubscriptionStore'
import SubscriptionsPage from '../subscriptions/SubscriptionsPage'
import ManagePage from '../manage/ManagePage'

const TABS = [
  { key: 'member', label: '我是成員', icon: Users },
  { key: 'host',   label: '我是團主', icon: Crown },
]

function StatItem({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-black text-ink tabular-nums">{value}</span>
      <span className="text-xs text-ink-3">{label}</span>
    </div>
  )
}

function StatsBar({ userId }) {
  const allGroups = useGroupStore(s => s.groups)
  const allSubs   = useSubscriptionStore(s => s.subscriptions)

  const hostedGroups       = allGroups.filter(g => g.hostId === userId)
  const activeHostedGroups = hostedGroups.filter(g => g.status === 'active')
  const hostMonthly        = activeHostedGroups.reduce((sum, g) => {
    const memberCount = Math.max(0, (g.usedSeats ?? 1) - 1)
    return sum + (g.pricePerSeat ?? g.monthlyFee ?? 0) * memberCount
  }, 0)

  const memberSubs       = allSubs.filter(s => s.userId === userId)
  const activeMemberSubs = memberSubs.filter(s => s.status === 'active')
  const memberMonthly    = activeMemberSubs.reduce((sum, s) => sum + (s.pricePerSeat ?? 0), 0)

  return (
    <div className="card mb-6 flex flex-col gap-4 px-6 py-4 md:flex-row md:gap-0 md:divide-x md:divide-line">

      {/* 身為團主 */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-3">
          <Crown size={12} className="text-warning" />
          身為團主
        </div>
        <div className="flex items-center justify-around">
          <StatItem label="活躍群組" value={activeHostedGroups.length} />
          <div className="h-8 w-px bg-line" />
          <StatItem label="累計建立" value={hostedGroups.length} />
          <div className="h-8 w-px bg-line" />
          <StatItem label="月收 PM" value={hostMonthly.toLocaleString()} />
        </div>
      </div>

      <div className="h-px bg-line md:hidden" />

      {/* 身為成員 */}
      <div className="flex flex-1 flex-col gap-3 md:pl-6">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-3">
          <Users size={12} className="text-brand" />
          身為成員
        </div>
        <div className="flex items-center justify-around">
          <StatItem label="活躍訂閱" value={activeMemberSubs.length} />
          <div className="h-8 w-px bg-line" />
          <StatItem label="累計訂閱" value={memberSubs.length} />
          <div className="h-8 w-px bg-line" />
          <StatItem label="月支 PM" value={memberMonthly.toLocaleString()} />
        </div>
      </div>

    </div>
  )
}

export default function MyGroupsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeView = searchParams.get('view') || 'member'
  const userId = useAuthStore(s => s.user?.id)

  function switchTab(view) {
    navigate(`/my-groups?view=${view}`, { replace: true })
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="page-title">我的群組</h1>
      </div>

      <div className="px-2 md:px-4 lg:px-16">
        {userId && <StatsBar userId={userId} />}
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

      {/* Content */}
      {activeView === 'host'
        ? <ManagePage embedded />
        : <SubscriptionsPage embedded />
      }
    </div>
  )
}
