import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Compass, Zap } from 'lucide-react'
import { getGroups, getRecruitingGroups } from '../../shared/stores/groupStore'
import { getActiveUserProfile } from '../../shared/stores/userStore'
import GroupCard from '../../shared/components/cards/GroupCard'
import EmptyState from '../../shared/components/ui/EmptyState'
import FilterBar from './components/FilterBar'
import WelcomeBanner from './components/WelcomeBanner'
import RecommendationCarousel from './components/RecommendationCarousel'
import HostLeaderboard from './components/HostLeaderboard'
import TrustSection from './components/TrustSection'

const DEFAULT_FILTERS = {
  keyword:  '',
  service:  'all',
  joinMode: 'all',
  maxPrice: 'any',
  sortBy:   'recommended',
}

function applyFilters(groups, { keyword, service, joinMode, maxPrice, sortBy }) {
  let result = groups.filter(g => g.status === 'recruiting')

  if (keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    result = result.filter(g =>
      g.serviceName.toLowerCase().includes(kw) ||
      g.planName.toLowerCase().includes(kw) ||
      g.hostName.toLowerCase().includes(kw) ||
      g.description.toLowerCase().includes(kw) ||
      g.tags.some(t => t.toLowerCase().includes(kw))
    )
  }

  if (service !== 'all')
    result = result.filter(g => g.serviceId === service)

  if (joinMode !== 'all')
    result = result.filter(g => g.joinMode === joinMode)

  if (maxPrice !== 'any')
    result = result.filter(g => g.pricePerSeat <= Number(maxPrice))

  switch (sortBy) {
    case 'rating':    result.sort((a, b) => b.hostRating - a.hostRating); break
    case 'price_asc': result.sort((a, b) => a.pricePerSeat - b.pricePerSeat); break
    case 'seats':     result.sort((a, b) => a.openSeats - b.openSeats); break
    default:
      result.sort((a, b) => {
        const score = g => (g.isHostVerified ? 2 : 0) + (g.joinMode === 'instant' ? 1 : 0) + g.hostRating / 5
        return score(b) - score(a)
      })
  }

  return result
}

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    keyword: searchParams.get('q') ?? '',
  }))

  const navigate = useNavigate()
  const user = getActiveUserProfile()
  const userName = user?.displayName ?? user?.name ?? ''

  const recommendedGroups = useMemo(() => getRecruitingGroups().slice(0, 8), [])
  const allGroups = useMemo(() => getGroups(), [])

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    if (!q) return
    const handle = window.setTimeout(() => {
      setFilters(prev => prev.keyword === q ? prev : ({ ...prev, keyword: q }))
    }, 0)
    return () => window.clearTimeout(handle)
  }, [searchParams])

  const filtered = useMemo(() => applyFilters(allGroups, filters), [allGroups, filters])

  function handleFilterChange(patch) {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  return (
    <div className="space-y-10 px-2 sm:px-4 lg:px-8 xl:px-16">
      <WelcomeBanner userName={userName} />

      <HostLeaderboard />

      <section>
        <h2 className="mb-5 text-xl font-extrabold tracking-tight text-ink text-center">為你推薦</h2>
        <RecommendationCarousel groups={recommendedGroups} />
      </section>

      <button
        onClick={() => navigate('/quick-match')}
        className="group w-full overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-brand to-brand-hover p-5 text-center shadow-button transition-opacity hover:opacity-90"
      >
        <div className="flex items-center justify-center gap-2">
          <Zap size={18} className="fill-white text-white" />
          <span className="text-base font-extrabold text-white">快速配對</span>
        </div>
        <p className="mt-1.5 text-sm font-medium text-white/80">設定條件，讓系統幫你找到最適合的群組</p>
      </button>

      <section>
        <h2 className="mb-5 text-xl font-extrabold tracking-tight text-ink text-center">探索群組</h2>
        <FilterBar filters={filters} onChange={handleFilterChange} />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="沒有符合條件的群組"
            description="試著調整篩選條件，或清除所有篩選"
            actionLabel="清除篩選"
            onAction={() => setFilters(DEFAULT_FILTERS)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filtered.map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-6">
        <TrustSection />
      </div>
    </div>
  )
}
