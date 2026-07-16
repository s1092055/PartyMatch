import { Banknote, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import Avatar from '../../../../../shared/ui/Avatar'
import EmptyState from '../../../../../shared/ui/EmptyState'

export function buildBillingPanel({ isActivated, members, expandedBillingMembers, toggleBillingMember }) {
  return {
    content: isActivated ? (
      <div className="p-5">
        {members.length === 0 ? (
          <EmptyState icon={Banknote} title="目前尚無收款紀錄" />
        ) : (
          <div className="space-y-4">
            {members.map(m => {
              const records = []
              const expanded = expandedBillingMembers.has(m.id)
              return (
                <div key={m.id} className="overflow-hidden rounded-xl border border-line">
                  <button onClick={() => toggleBillingMember(m.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised">
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{m.userName}</p>
                    <span className="text-xs text-ink-3">{records.length} 筆</span>
                    {expanded ? <ChevronUp size={14} strokeWidth={1.5} className="shrink-0 text-ink-3" /> : <ChevronDown size={14} strokeWidth={1.5} className="shrink-0 text-ink-3" />}
                  </button>
                  {expanded && (
                    <div className="border-t border-line-subtle">
                      {records.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-ink-3">尚無收款紀錄</p>
                      ) : records.map(rec => (
                        <div key={rec.id} className="border-b border-line-subtle px-4 py-3 last:border-0 space-y-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 size={14} className="shrink-0 text-success" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-ink">已收款金額</p>
                              <p className="text-xs text-ink-3">{rec.paidAt?.slice(0, 10)}</p>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-success">NT${rec.amount}</span>
                          </div>
                          {rec.proofUrl && (
                            <a href={rec.proofUrl} target="_blank" rel="noopener noreferrer">
                              <img src={rec.proofUrl} alt="付款截圖" className="w-full rounded-xl border border-line object-contain transition-opacity hover:opacity-80" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    ) : (
      <div className="p-5">
        {members.length === 0 ? (
          <EmptyState icon={Banknote} title="目前尚無成員" />
        ) : (
          <div className="space-y-2">
            {members.map(m => {
              const records = []
              const expanded = expandedBillingMembers.has(m.id)
              return (
                <div key={m.id} className="overflow-hidden rounded-xl border border-line">
                  <button onClick={() => toggleBillingMember(m.id)} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-raised">
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{m.userName}</p>
                    {expanded ? <ChevronUp size={14} strokeWidth={1.5} className="shrink-0 text-ink-3" /> : <ChevronDown size={14} strokeWidth={1.5} className="shrink-0 text-ink-3" />}
                  </button>
                  {expanded && (
                    <div className="border-t border-line-subtle px-4 py-3 space-y-3">
                      {records.length === 0 ? (
                        <p className="text-xs text-ink-3">尚無付款紀錄</p>
                      ) : records.map(rec => (
                        <div key={rec.id} className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 size={14} className="shrink-0 text-success" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-ink">已收款金額</p>
                              <p className="text-xs text-ink-3">{rec.paidAt?.slice(0, 10)}</p>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-success">NT${rec.amount}</span>
                          </div>
                          {rec.proofUrl && (
                            <a href={rec.proofUrl} target="_blank" rel="noopener noreferrer">
                              <img src={rec.proofUrl} alt="付款截圖" className="w-full rounded-xl border border-line object-contain transition-opacity hover:opacity-80" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    ),
  }
}
