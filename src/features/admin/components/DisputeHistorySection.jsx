import { useEffect, useState } from 'react'
import { Handshake, ArrowDownLeft, TrendingUp, SplitSquareHorizontal, ShieldCheck } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { fetchAdminDisputeHistory } from '../../../common/api/adminApi'
import { formatRelativeDate } from '../../../common/utils/date'

const RESOLUTION_CONFIG = {
  host_private_resolved: { label: '團主自行解決', icon: Handshake,               color: 'text-ink-3' },
  member_full_refund:    { label: '成員全額退款', icon: ArrowDownLeft,            color: 'text-success' },
  host_full_release:     { label: '團主全額撥款', icon: TrendingUp,               color: 'text-info-text' },
  partial_split:         { label: '部分退款',     icon: SplitSquareHorizontal,    color: 'text-warning-text' },
}

function getConfig(type) {
  return RESOLUTION_CONFIG[type] ?? { label: type, icon: ShieldCheck, color: 'text-ink-3' }
}

export default function DisputeHistorySection({ refreshKey }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetchAdminDisputeHistory({ take: 50 })
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [refreshKey])

  return (
    <Card className="p-0">
      <div className="border-b border-line-subtle px-4 py-3">
        <span className="text-sm font-bold text-ink">裁定歷史紀錄</span>
      </div>
      {loading ? (
        <p className="py-8 text-center text-xs text-ink-4">載入中…</p>
      ) : history.length === 0 ? (
        <p className="py-8 text-center text-xs text-ink-4">尚無已處理的申訴</p>
      ) : (
        <div className="divide-y divide-line-subtle">
          {history.map(h => {
            const cfg = getConfig(h.resolutionType)
            const Icon = cfg.icon
            return (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised ${cfg.color}`}>
                  <Icon size={16} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{cfg.label}</p>
                    <span className="truncate text-xs text-ink-4">{h.planName}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-4">
                    {h.memberUserName} vs {h.hostName}
                    {h.resolvedByAdminName && ` · 裁定人：${h.resolvedByAdminName}`}
                  </p>
                  {h.resolutionNote && <p className="mt-0.5 truncate text-xs text-ink-4">{h.resolutionNote}</p>}
                  <p className="text-2xs text-ink-4">{formatRelativeDate(h.resolvedAt ?? h.raisedAt)}</p>
                </div>
                {(h.memberRefundAmount != null || h.hostReleaseAmount != null) && (
                  <div className="shrink-0 text-right text-xs font-bold tabular-nums text-ink-3">
                    {h.memberRefundAmount != null && <p>成員 +{h.memberRefundAmount}</p>}
                    {h.hostReleaseAmount != null && <p>團主 +{h.hostReleaseAmount}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
