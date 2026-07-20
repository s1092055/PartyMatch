import { ArrowDownCircle, ArrowUpCircle, Banknote, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import Avatar from '../../../../../shared/ui/primitives/Avatar'
import EmptyState from '../../../../../shared/ui/primitives/EmptyState'
import TokenAmount from '../../../../../shared/ui/TokenAmount'

const TX_META = {
  escrow: { label: '代管入帳', Icon: ArrowDownCircle, cls: 'text-info' },
  refund: { label: '已退款',   Icon: RotateCcw,       cls: 'text-warning' },
  release: { label: '已撥款',  Icon: ArrowUpCircle,   cls: 'text-success' },
}

function renderTransactionRow(tx) {
  const meta = TX_META[tx.type] ?? { label: tx.type, Icon: Banknote, cls: 'text-ink-3' }
  return (
    <div key={tx.id} className="flex items-center gap-3 border-b border-line-subtle px-4 py-3 last:border-0">
      <meta.Icon size={14} className={`shrink-0 ${meta.cls}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{meta.label}</p>
        <p className="text-xs text-ink-3">{tx.createdAt?.slice(0, 10)}{tx.note ? ` · ${tx.note}` : ''}</p>
      </div>
      <span className={`shrink-0 text-sm font-bold ${meta.cls}`}>
        <TokenAmount amount={Math.abs(tx.amount)} />
      </span>
    </div>
  )
}

export function buildBillingPanel({ members, transactions, transactionsLoading, expandedBillingMembers, toggleBillingMember }) {
  // release（撥款給團主本人）不屬於任何成員，獨立加總顯示在頂部摘要
  const releasedTotal = transactions
    .filter(tx => tx.type === 'release')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const byMemberUserId = transactions.reduce((acc, tx) => {
    if (tx.type === 'release') return acc
    ;(acc[tx.userId] ??= []).push(tx)
    return acc
  }, {})

  return {
    content: (
      <div className="p-5">
        {transactionsLoading ? (
          <p className="py-8 text-center text-sm text-ink-3">載入中…</p>
        ) : members.length === 0 ? (
          <EmptyState icon={Banknote} title="目前尚無成員" />
        ) : (
          <div className="space-y-4">
            {releasedTotal > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success-subtle px-4 py-3">
                <ArrowUpCircle size={16} className="shrink-0 text-success" />
                <p className="min-w-0 flex-1 text-sm font-semibold text-success-text">已撥款給你的代管總額</p>
                <span className="shrink-0 text-sm font-bold text-success-text"><TokenAmount amount={releasedTotal} /></span>
              </div>
            )}
            {members.map(m => {
              const records = byMemberUserId[m.userId] ?? []
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
                        <p className="px-4 py-3 text-xs text-ink-3">尚無交易紀錄</p>
                      ) : records.map(renderTransactionRow)}
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
