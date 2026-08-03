import { DEFAULT_CREDIT_SCORE, getCreditDisplay } from '../../common/utils/creditScore'

export default function CreditScoreBadge({ score, size = 'sm' }) {
  const displayScore = score ?? DEFAULT_CREDIT_SCORE
  const { label, color, bg, border } = getCreditDisplay(displayScore)

  if (size === 'lg') {
    return (
      <div className={`inline-flex items-baseline gap-2 rounded-2xl border px-5 py-3 ${bg} ${border}`}>
        <span className={`text-4xl font-black ${color}`}>{displayScore}</span>
        <span className={`text-xs font-bold ${color}`}>{label}</span>
      </div>
    )
  }

  if (size === 'md') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold ${bg} ${border} ${color}`}>
        {displayScore}
        <span className="text-xs font-normal opacity-70">{label}</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${bg} ${color}`}>
      {displayScore}
      <span className="opacity-70">{label}</span>
    </span>
  )
}
