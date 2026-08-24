import { ArrowUpCircle, Banknote } from 'lucide-react'
import EmptyState from '../../../../components/ui/primitives/EmptyState'
import EscrowStatusCard from '../../../../components/ui/EscrowStatusCard'
import { formatDateTime } from '../../../../common/utils/date'

const RELEASED_STATUSES = ['active', 'ended']

export function buildPaymentsPanel({ group, member, transactions, transactionsLoading }) {
  const latestEscrow = transactions.find(tx => tx.type === 'escrow') ?? null;
  const isReleased   = RELEASED_STATUSES.includes(group.status)
  const escrowTime = member?.joinedAtTime ?? latestEscrow?.createdAt;

  return {
    content: (
      <div className="p-5">
        {transactionsLoading ? (
          <p className="py-8 text-center text-sm text-ink-3">載入中…</p>
        ) : !latestEscrow ? (
          <EmptyState icon={Banknote} title="目前尚無代管紀錄" />
        ) : (
          isReleased ? (
            <EscrowStatusCard
              tone="success"
              icon={ArrowUpCircle}
              title="本期費用已撥款給團主"
              subtitle={`${formatDateTime(escrowTime)} 平台代管`}
              amount={Math.abs(latestEscrow.amount)}
            />
          ) : (
            <EscrowStatusCard
              tone="info"
              icon={Banknote}
              title="本期費用由平台代管中"
              subtitle={`${formatDateTime(escrowTime)} 平台代管`}
              amount={Math.abs(latestEscrow.amount)}
            />
          )
        )}
      </div>
    ),
  }
}
