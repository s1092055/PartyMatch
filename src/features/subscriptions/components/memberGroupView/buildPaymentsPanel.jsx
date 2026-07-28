import { ArrowUpCircle, Banknote } from 'lucide-react'
import EmptyState from '../../../../shared/ui/primitives/EmptyState'
import EscrowStatusCard from '../../../../shared/ui/EscrowStatusCard'
import { formatDateTime } from '../../../../shared/utils/date'

const RELEASED_STATUSES = ['active', 'paused', 'ended']

export function buildPaymentsPanel({ group, member, transactions, transactionsLoading }) {
  // 只顯示「最新一筆」代管紀錄，跟團主端收款管理的邏輯對齊；退款等歷史紀錄改到（未來的）PM幣交易紀錄查詢
  const latestEscrow = transactions.find(tx => tx.type === 'escrow') ?? null
  const isReleased   = RELEASED_STATUSES.includes(group.status)
  // 顯示團主按下「接受」的時間（Member.joinedAt），不是申請送出當下實際扣款的時間（tx.createdAt）——
  // 代管扣款雖然在申請當下就發生，但對成員來說「入帳」的認知時間點是團主接受申請的那一刻
  const escrowTime = member?.joinedAtTime ?? latestEscrow?.createdAt

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
              subtitle={`${formatDateTime(escrowTime)} 代管入帳`}
              amount={Math.abs(latestEscrow.amount)}
            />
          ) : (
            <EscrowStatusCard
              tone="info"
              icon={Banknote}
              title="本期費用由平台代管中"
              subtitle={`${formatDateTime(escrowTime)} 代管入帳`}
              amount={Math.abs(latestEscrow.amount)}
            />
          )
        )}
      </div>
    ),
  }
}
