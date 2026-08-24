import { ArrowUpCircle, Banknote, RefreshCw } from 'lucide-react'
import { Avatar } from '../../../../components/ui/avatar'
import { PresenceDot } from '../../../../common/layout/components/navShared'
import { Button } from '../../../../components/ui/button'
import EmptyState from '../../../../components/ui/primitives/EmptyState'
import EscrowStatusCard from '../../../../components/ui/EscrowStatusCard'
import TokenAmount from '../../../../components/ui/TokenAmount'
import { formatDateTime } from '../../../../common/utils/date'

export function buildBillingPanel({ members, transactions, transactionsLoading, showRenewal, onOpenRenewal, escrowTokens }) {
  const releasedTotal = transactions
    .filter(tx => tx.type === 'release')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const latestEscrowByUserId = {};
  for (const tx of transactions) {
    if (tx.type !== 'escrow') continue
    latestEscrowByUserId[tx.userId] ??= tx;
  }

  const memberEscrowTotal = escrowTokens > 0
    ? members.reduce((sum, m) => {
        const tx = latestEscrowByUserId[m.userId]
        return sum + (tx ? Math.abs(tx.amount) : 0)
      }, 0)
    : 0;

  return {
    content: (
      <div className={`relative min-h-full p-5 ${showRenewal ? 'pb-16' : ''}`}>
        {transactionsLoading ? (
          <p className="py-8 text-center text-sm text-ink-3">載入中…</p>
        ) : members.length === 0 ? (
          <EmptyState icon={Banknote} title="目前尚無成員" />
        ) : (
          <div className="space-y-4">
            {memberEscrowTotal > 0 && (
              <EscrowStatusCard tone="info" icon={Banknote} title="本期費用由平台代管中" amount={memberEscrowTotal} />
            )}
            {releasedTotal > 0 && (
              <EscrowStatusCard tone="success" icon={ArrowUpCircle} title="已撥款給你的代管總額" amount={releasedTotal} />
            )}
            <div className="overflow-hidden rounded-lg border border-line">
              {members.map((m, i) => {
                const tx = latestEscrowByUserId[m.userId]
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line-subtle' : ''}`}>
                    <span className="relative inline-block shrink-0">
                      <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                      <PresenceDot status={m.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.userName}</p>

                      <p className="text-xs text-ink-3">{tx ? `${formatDateTime(m.joinedAtTime)} 平台代管` : '尚無代管紀錄'}</p>
                    </div>
                    {tx && <span className="shrink-0 text-sm font-bold text-info"><TokenAmount amount={Math.abs(tx.amount)} /></span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {showRenewal && (
          <Button
            variant="ghost"
            onClick={() => onOpenRenewal?.()}
            className="absolute bottom-4 right-4 h-9 shrink-0 rounded-lg border border-line bg-canvas px-3"
          >
            <RefreshCw size={14} strokeWidth={1.5} />
            續訂服務
          </Button>
        )}
      </div>
    ),
  };
}
