import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Archive, ArrowLeftRight, Crown, Layers, PiggyBank, Users, Wallet } from 'lucide-react'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useSubscriptionStore } from '../../shared/stores/useSubscriptionStore'
import TokenAmount from '../../shared/ui/TokenAmount'
import { getPlanByName } from '../../shared/utils/pricingUtils'
import MemberPage from './member/MemberPage'
import HostPage from './host/HostPage'

const TABS = [
  { key: 'member', label: '我是成員', icon: Users },
  { key: 'host',   label: '我是團主', icon: Crown },
]

// 反查方案原價（未分攤前整組月費），用來估算合購省下多少錢
function planOriginalMonthly(serviceId, planName) {
  const plan = getPlanByName(serviceId, planName)
  return plan ? plan.monthlyPrice : null
}

function avg(total, count) {
  return count > 0 ? Math.round(total / count) : 0
}

function seatMemberCount(group) {
  return Math.max(0, (group.usedSeats ?? 1) - 1)
}

const STAT_TONE_CLASSES = {
  success: 'bg-success-subtle text-success-text',
  brand:   'bg-brand-subtle text-brand',
  info:    'bg-info-subtle text-info-text',
}

// 儀表板風格的獨立數字卡（icon + 標籤 + 數字），取代原本擠在同一張卡裡用分隔線隔開的排法
function StatTile({ icon: Icon, label, amount, value, tone, activeView }) {
  return (
    <div key={activeView} className="card flex animate-step-slide-up items-center gap-3 rounded-xl p-4 shadow-none">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${STAT_TONE_CLASSES[tone]}`}>
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-ink-3">{label}</p>
        {amount != null
          ? <TokenAmount amount={amount} className="text-lg font-black text-ink" unitClassName="!text-xs" />
          : <span className="text-lg font-black text-ink tabular-nums">{value}</span>}
      </div>
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
    const original = planOriginalMonthly(s.serviceId, s.planName)
    if (original != null) acc.memberSavings += Math.max(0, original - (s.pricePerSeat ?? 0))
    return acc
  }, { memberMonthly: 0, memberSavings: 0 })
  const memberAvgPerSub = avg(memberMonthly, activeMemberSubs.length)

  const isHost = activeView === 'host'

  return (
    <div className="grid h-full grid-cols-1 gap-3 sm:grid-cols-3">
      {isHost ? (
        <>
          <StatTile icon={Wallet}     label="本月預估收入" amount={hostMonthly}    tone="success" activeView={activeView} />
          <StatTile icon={Layers}     label="平均每組"     amount={hostAvgPerGroup} tone="brand"   activeView={activeView} />
          <StatTile icon={Users}      label="服務中成員"   value={hostMemberCount}  tone="info"    activeView={activeView} />
        </>
      ) : (
        <>
          <StatTile icon={Wallet}     label="本月訂閱花費" amount={memberMonthly}   tone="brand"   activeView={activeView} />
          <StatTile icon={Layers}     label="平均每組"     amount={memberAvgPerSub} tone="info"    activeView={activeView} />
          <StatTile icon={PiggyBank}  label="本月省下"     amount={memberSavings}   tone="success" activeView={activeView} />
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
      {/* 身分切換：標題緊接著一顆「切換身份」icon 按鈕，「群組紀錄」icon 按鈕放在最右側，
          兩顆按鈕不管手機/電腦版都只用 icon 呈現 */}
      <div className="mb-4 flex items-center justify-between px-2 md:px-4 lg:px-16">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-2 text-xl font-black text-ink">
            <CurrentIcon size={20} strokeWidth={1.5} className="text-brand" />
            {currentTab.label}
          </h2>
          <button
            onClick={toggleTab}
            aria-label="切換身份"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:bg-raised hover:text-ink"
          >
            <ArrowLeftRight size={13} strokeWidth={1.5} />
          </button>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          aria-label="群組紀錄"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
        >
          <Archive size={14} strokeWidth={1.5} />
          群組紀錄
        </button>
      </div>

      {/* 統計卡 */}
      <div className="mb-6 px-2 md:px-4 lg:px-16">
        {userId && <StatsBar userId={userId} activeView={activeView} />}
      </div>

      {/* Content */}
      {activeView === 'host'
        ? <HostPage embedded historyOpen={historyOpen} onCloseHistory={() => setHistoryOpen(false)} />
        : <MemberPage embedded historyOpen={historyOpen} onCloseHistory={() => setHistoryOpen(false)} />
      }
    </div>
  )
}
