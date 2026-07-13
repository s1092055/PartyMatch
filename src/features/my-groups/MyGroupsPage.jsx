import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Crown, Users } from 'lucide-react'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useSubscriptionStore } from '../../shared/stores/useSubscriptionStore'
import TokenAmount from '../../shared/ui/TokenAmount'
import { getPlanByName, getPlanMonthlyEquivalent } from '../../shared/utils/pricingUtils'
import SubscriptionsPage from '../subscriptions/SubscriptionsPage'
import ManagePage from '../manage/ManagePage'

const TABS = [
  { key: 'member', label: '我是成員', icon: Users },
  { key: 'host',   label: '我是團主', icon: Crown },
]

// 反查方案原價（未分攤前整組月費），用來估算合購省下多少錢
function planOriginalMonthly(serviceId, planName, billingCycle) {
  const plan = getPlanByName(serviceId, planName)
  return plan ? Math.round(getPlanMonthlyEquivalent(plan, billingCycle)) : null
}

function avg(total, count) {
  return count > 0 ? Math.round(total / count) : 0
}

function seatMemberCount(group) {
  return Math.max(0, (group.usedSeats ?? 1) - 1)
}

function AmountStatItem({ label, amount, activeView }) {
  return (
    <div key={activeView} className="flex flex-1 animate-step-slide-up flex-col items-center gap-0.5 px-2">
      <TokenAmount amount={amount} className="text-lg font-black text-ink" unitClassName="!text-xs" />
      <span className="text-xs text-ink-3">{label}</span>
    </div>
  )
}

function CountStatItem({ label, value, activeView }) {
  return (
    <div key={activeView} className="flex flex-1 animate-step-slide-up flex-col items-center gap-0.5 px-2">
      <span className="text-lg font-black text-ink tabular-nums">{value}</span>
      <span className="text-xs text-ink-3">{label}</span>
    </div>
  )
}

function StatsBar({ userId, activeView }) {
  const allGroups = useGroupStore(s => s.groups)
  const allSubs   = useSubscriptionStore(s => s.subscriptions)

  const activeHostedGroups = allGroups.filter(g => g.hostId === userId && g.status === 'active')
  const { hostMonthly, hostMemberCount } = activeHostedGroups.reduce((acc, g) => {
    const memberCount = seatMemberCount(g)
    acc.hostMonthly += (g.pricePerSeat ?? g.monthlyFee ?? 0) * memberCount
    acc.hostMemberCount += memberCount
    return acc
  }, { hostMonthly: 0, hostMemberCount: 0 })
  const hostAvgPerGroup = avg(hostMonthly, activeHostedGroups.length)

  const activeMemberSubs = allSubs.filter(s => s.userId === userId && s.status === 'active')
  const { memberMonthly, memberSavings } = activeMemberSubs.reduce((acc, s) => {
    acc.memberMonthly += s.pricePerSeat ?? 0
    const original = planOriginalMonthly(s.serviceId, s.planName, s.billingCycle)
    if (original != null) acc.memberSavings += Math.max(0, original - (s.pricePerSeat ?? 0))
    return acc
  }, { memberMonthly: 0, memberSavings: 0 })
  const memberAvgPerSub = avg(memberMonthly, activeMemberSubs.length)

  const isHost = activeView === 'host'

  return (
    <div className="card flex h-full items-center divide-x divide-line-subtle rounded-xl py-7 shadow-none">
      {isHost ? (
        <>
          <AmountStatItem label="本月預估收入" amount={hostMonthly} activeView={activeView} />
          <AmountStatItem label="平均每組"     amount={hostAvgPerGroup} activeView={activeView} />
          <CountStatItem  label="服務中成員"   value={hostMemberCount} activeView={activeView} />
        </>
      ) : (
        <>
          <AmountStatItem label="本月訂閱花費" amount={memberMonthly} activeView={activeView} />
          <AmountStatItem label="平均每組"     amount={memberAvgPerSub} activeView={activeView} />
          <AmountStatItem label="本月省下"     amount={memberSavings} activeView={activeView} />
        </>
      )}
    </div>
  )
}

export default function MyGroupsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeView = searchParams.get('view') || 'member'
  const userId = useAuthStore(s => s.user?.id)

  const currentTab = TABS.find(tab => tab.key === activeView) ?? TABS[0]
  const CurrentIcon = currentTab.icon

  function switchTab(view) {
    navigate(`/my-groups?view=${view}`, { replace: true })
  }

  function toggleTab() {
    switchTab(activeView === 'host' ? 'member' : 'host')
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="page-title">我的群組</h1>
      </div>

      {/* 手機版：左右兩顆全寬 switcher 按鈕（點擊直接切換） */}
      <div className="mb-6 flex gap-4 px-2 md:hidden">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-[0.96] ${
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

      {/* 桌機版：切換身分（hover 整個區域改顯示「切換身分」提示，點擊 toggle 到另一個身分）＋ 統計卡左右並排，
          左欄寬度對齊下方 tab header（w-40），高度對齊右側統計卡 */}
      <div className="mb-6 flex flex-col gap-6 px-2 md:flex-row md:items-stretch md:px-4 lg:gap-8 lg:px-16">
        <div className="hidden md:flex md:w-40 md:shrink-0 md:justify-center">
          <button
            onClick={toggleTab}
            aria-label="切換身分"
            className="group relative flex w-40 flex-col items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
          >
            <span className="flex items-center gap-1.5 transition-opacity duration-150 group-hover:opacity-0">
              <CurrentIcon size={16} strokeWidth={2.1} />
              <span key={activeView} className="animate-fade-in-up">{currentTab.label}</span>
            </span>
            <span className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <ArrowLeftRight size={14} strokeWidth={1.5} />
              切換身分
            </span>
          </button>
        </div>

        <div className="min-w-0 md:flex-1">
          {userId && <StatsBar userId={userId} activeView={activeView} />}
        </div>
      </div>

      {/* Content */}
      {activeView === 'host'
        ? <ManagePage embedded />
        : <SubscriptionsPage embedded />
      }
    </div>
  )
}
