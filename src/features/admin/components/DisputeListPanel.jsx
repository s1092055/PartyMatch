import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { fetchAdminDisputes } from '../../../common/api/adminApi'
import { formatRelativeDate } from '../../../common/utils/date'

function isOverdue(d) {
  return !!d.deadline && new Date(d.deadline) <= new Date()
}

export default function DisputeListPanel({ selectedId, onSelect, refreshKey }) {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetchAdminDisputes({ status: 'pending' })
      .then(rows => {
        const sorted = [...rows].sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)))
        setDisputes(sorted)
        if (!selectedId && sorted.length > 0) onSelect(sorted[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  return (
    <Card className="p-0">
      <div className="border-b border-line-subtle px-4 py-3">
        <span className="text-sm font-bold text-ink">待裁定申訴</span>
      </div>
      <div className="max-h-[60dvh] overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-xs text-ink-4">載入中…</p>
        ) : disputes.length === 0 ? (
          <p className="py-8 text-center text-xs text-ink-4">目前沒有待裁定的申訴</p>
        ) : disputes.map(d => (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            className={`block w-full border-b border-line-subtle px-4 py-3 text-left transition-colors hover:bg-raised ${
              d.id === selectedId ? 'bg-brand-subtle' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-ink">{d.planName}</span>
              {isOverdue(d) && (
                <Badge variant="destructive" className="shrink-0">
                  <Clock size={10} strokeWidth={1.5} /> 逾期
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-ink-3">{d.memberUserName} 對 {d.hostName} 提出申訴</p>
            <p className="mt-1 truncate text-xs text-ink-4">{d.reason}</p>
            <p className="mt-1 text-2xs text-ink-4">{formatRelativeDate(d.raisedAt)}</p>
          </button>
        ))}
      </div>
    </Card>
  )
}
