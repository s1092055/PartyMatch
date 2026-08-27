import { useMemo } from 'react'
import { Medal, ShieldCheck, Star } from 'lucide-react'
import { getGroups } from '../../../shared/stores/groupStore'

function buildLeaderboard(groups) {
  const map = {}
  for (const g of groups) {
    if (!map[g.hostId]) {
      map[g.hostId] = {
        hostId:            g.hostId,
        hostName:          g.hostName,
        hostAvatarInitial: g.hostAvatarInitial,
        hostAvatarColor:   g.hostAvatarColor,
        isHostVerified:    g.isHostVerified,
        hostRating:        g.hostRating,
        reviewCount:       g.reviewCount ?? 0,
        groupCount:        0,
        openSeats:         0,
      }
    }
    map[g.hostId].groupCount++
    map[g.hostId].openSeats += g.openSeats ?? 0
  }
  return Object.values(map)
    .sort((a, b) => b.hostRating - a.hostRating || b.reviewCount - a.reviewCount)
    .slice(0, 5)
}

// Desktop podium order: rank4, rank2, rank1, rank3, rank5
const PODIUM_ORDER = [3, 1, 0, 2, 4]

const RANK_THEMES = [
  // Rank 1 — logo deep blue gradient
  {
    card:   'bg-gradient-to-b from-[#3C81FF] to-[#244D99] border-transparent shadow-[0_16px_40px_-10px_rgba(60,129,255,0.5)]',
    badge:  'bg-white/20 text-white ring-white/30',
    name:   'text-white text-base',
    sub:    'text-white/65 text-xs',
    rating: 'text-white text-sm',
    avatar: 'h-16 w-16 text-xl ring-4 ring-white/30',
    card_py:'py-8 px-5',
    star:   14,
    badgeSz:'h-6 w-6 text-xs',
    shield: 'text-white/80',
  },
  // Rank 2 — logo sky blue tint
  {
    card:   'bg-gradient-to-b from-[#EBF7FF] to-[#D0EEFA] border-[#69C2EE]/40 shadow-md',
    badge:  'bg-slate-100 text-slate-500 ring-slate-300',
    name:   'text-ink text-sm',
    sub:    'text-ink-3 text-xs',
    rating: 'text-ink text-sm',
    avatar: 'h-13 w-13 text-base',
    card_py:'py-6 px-4',
    star:   13,
    badgeSz:'h-5 w-5 text-[11px]',
    shield: 'text-brand',
  },
  // Rank 3 — logo sky blue tint (lighter)
  {
    card:   'bg-gradient-to-b from-[#EBF7FF] to-[#D0EEFA] border-[#69C2EE]/40 shadow-md',
    badge:  'bg-orange-50 text-orange-400 ring-orange-200',
    name:   'text-ink text-sm',
    sub:    'text-ink-3 text-xs',
    rating: 'text-ink text-sm',
    avatar: 'h-13 w-13 text-base',
    card_py:'py-6 px-4',
    star:   13,
    badgeSz:'h-5 w-5 text-[11px]',
    shield: 'text-brand',
  },
  // Rank 4 — white, dimmed
  {
    card:   'bg-white border-line shadow-sm opacity-60',
    badge:  'bg-raised text-ink-3 ring-line',
    name:   'text-ink text-xs',
    sub:    'text-ink-3 text-xs',
    rating: 'text-ink text-xs',
    avatar: 'h-10 w-10 text-sm',
    card_py:'py-4 px-3',
    star:   11,
    badgeSz:'h-5 w-5 text-xs',
    shield: 'text-brand',
  },
  // Rank 5 — white, dimmed
  {
    card:   'bg-white border-line shadow-sm opacity-60',
    badge:  'bg-raised text-ink-3 ring-line',
    name:   'text-ink text-xs',
    sub:    'text-ink-3 text-xs',
    rating: 'text-ink text-xs',
    avatar: 'h-10 w-10 text-sm',
    card_py:'py-4 px-3',
    star:   11,
    badgeSz:'h-5 w-5 text-xs',
    shield: 'text-brand',
  },
]

function HostCard({ host, rankIndex, extraClass = '' }) {
  const t = RANK_THEMES[rankIndex] ?? RANK_THEMES[4]
  return (
    <div className={`relative flex flex-col items-center gap-2 rounded-[var(--radius-card)] border text-center ${t.card} ${t.card_py} ${extraClass}`}>
      <span className={`absolute top-3 left-3 flex items-center justify-center rounded-full font-black ring-1 ${t.badgeSz} ${t.badge}`}>
        {rankIndex + 1}
      </span>

      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-black text-white shadow-sm ${t.avatar}`}
        style={{ backgroundColor: host.hostAvatarColor }}
      >
        {host.hostAvatarInitial}
      </div>

      <div className="flex items-center gap-1">
        <span className={`truncate font-extrabold ${t.name}`}>{host.hostName}</span>
        {host.isHostVerified && <ShieldCheck size={13} className={`shrink-0 ${t.shield}`} />}
      </div>

      <div className="flex items-center gap-0.5">
        <Star size={t.star} className="fill-amber-400 text-amber-400" />
        <span className={`font-extrabold ${t.rating}`}>{host.hostRating.toFixed(1)}</span>
        <span className={t.sub}>({host.reviewCount})</span>
      </div>

      <p className={t.sub}>{host.groupCount} 個群組</p>
    </div>
  )
}

export default function HostLeaderboard() {
  const leaderboard = useMemo(() => buildLeaderboard(getGroups()), [])

  return (
    <section>
      <div className="mb-4 flex items-center justify-center gap-2">
        <Medal size={18} className="text-amber-500" />
        <h2 className="text-xl font-extrabold tracking-tight text-ink">優良團主排行榜</h2>
      </div>

      {/* Mobile: horizontal scroll carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [scroll-snap-type:x_mandatory] lg:hidden">
        {leaderboard.map((host, i) => (
          <HostCard
            key={host.hostId}
            host={host}
            rankIndex={i}
            extraClass="w-[72vw] shrink-0 [scroll-snap-align:start]"
          />
        ))}
      </div>

      {/* Desktop: podium layout */}
      <div className="hidden items-end justify-center gap-3 lg:flex">
        {PODIUM_ORDER.map(idx => {
          if (idx >= leaderboard.length) return null
          return (
            <HostCard
              key={leaderboard[idx].hostId}
              host={leaderboard[idx]}
              rankIndex={idx}
              extraClass="flex-1"
            />
          )
        })}
      </div>
    </section>
  )
}
