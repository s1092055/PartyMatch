import { getCreditDisplay } from '../../utils/creditScore'

export default function CreditScoreBadge({ score, size = 'sm' }) {
  const { label, color, bg, border } = getCreditDisplay(score ?? 80)

  if (size === 'lg') {
    return (
      <div className={`inline-flex items-baseline gap-2 rounded-2xl border px-5 py-3 ${bg} ${border}`}>
        <span className={`text-4xl font-black ${color}`}>{score ?? 80}</span>
        <div className="flex flex-col">
          <span className={`text-xs font-bold ${color}`}>{label}</span>
          <span className="text-xs text-ink-4">/ 100</span>
        </div>
      </div>
    )
  }

  if (size === 'md') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold ${bg} ${border} ${color}`}>
        {score ?? 80}
        <span className="text-xs font-normal opacity-70">{label}</span>
      </span>
    )
  }

  // size === 'sm' (default) — for cards and inline usage
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${bg} ${color}`}>
      {score ?? 80}
      <span className="opacity-70">{label}</span>
    </span>
  )
}
