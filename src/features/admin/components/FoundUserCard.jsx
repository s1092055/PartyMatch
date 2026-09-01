import { CheckCircle2 } from 'lucide-react'

export default function FoundUserCard({ user, onReset }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-subtle px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-ink">
        <CheckCircle2 strokeWidth={1.5} size={14} className="shrink-0 text-brand" />
        <span className="font-semibold">{user.name}</span>
        <span className="text-ink-4">{user.email}</span>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="shrink-0 text-xs font-semibold text-ink-3 underline-offset-2 hover:underline"
      >
        換一位
      </button>
    </div>
  )
}
