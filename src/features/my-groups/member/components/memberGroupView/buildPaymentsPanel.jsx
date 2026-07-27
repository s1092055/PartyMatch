import { ArrowUpCircle, Banknote } from 'lucide-react'
import EmptyState from '../../../../../shared/ui/primitives/EmptyState'
import EscrowStatusCard from '../../../../../shared/ui/EscrowStatusCard'
import { formatDateTime } from '../../../../../shared/utils/date'

const RELEASED_STATUSES = ['active', 'paused', 'ended']

export function buildPaymentsPanel({ group, transactions, transactionsLoading }) {
  // 只顯示「最新一筆」代管紀錄，跟團主端收款管理的邏輯對齊；退款等歷史紀錄改到（未來的）PM幣交易紀錄查詢
  const latestEscrow = transactions.find(tx => tx.type === 'escrow') ?? null
  const isReleased   = RELEASED_STATUSES.includes(group.status)

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
              subtitle={`${formatDateTime(latestEscrow.createdAt)} 代管入帳`}
              amount={Math.abs(latestEscrow.amount)}
            />
          ) : (
            <EscrowStatusCard
              tone="info"
              icon={Banknote}
              title="本期費用已交由平台代管，尚未撥款至團主帳戶"
              subtitle={`${formatDateTime(latestEscrow.createdAt)} 代管入帳`}
              amount={Math.abs(latestEscrow.amount)}
            />
          )
        )}
      </div>
    ),
  }
}
