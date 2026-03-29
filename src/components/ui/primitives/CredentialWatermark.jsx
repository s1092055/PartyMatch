import { formatDateTime } from '../../../common/utils/date'

export default function CredentialWatermark({ viewerName, children }) {
  const stamp = `${viewerName ?? '使用者'} · ${formatDateTime(new Date())}`

  return (
    <div className="relative overflow-hidden rounded-lg">
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none flex-wrap content-around justify-around gap-x-6 gap-y-4 overflow-hidden opacity-[0.08]"
        style={{ transform: 'rotate(-18deg) scale(1.3)' }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap text-xs font-bold text-ink">{stamp}</span>
        ))}
      </div>
    </div>
  )
}
