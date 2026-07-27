import { ArrowUpCircle, Banknote } from 'lucide-react'
import Avatar from '../../../../../shared/ui/primitives/Avatar'
import EmptyState from '../../../../../shared/ui/primitives/EmptyState'
import EscrowStatusCard from '../../../../../shared/ui/EscrowStatusCard'
import TokenAmount from '../../../../../shared/ui/TokenAmount'
import { formatDateTime } from '../../../../../shared/utils/date'

export function buildBillingPanel({ group, members, transactions, transactionsLoading }) {
  // release（撥款給團主本人）不屬於任何成員，獨立加總顯示在頂部摘要
  const releasedTotal = transactions
    .filter(tx => tx.type === 'release')
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 收款管理只需要呈現每位成員「目前」的代管狀態：最新一筆代管入帳即可；
  // 撤回重新申請等留下的舊代管/退款歷史紀錄不在這裡處理，改到（使用者端）PM幣交易紀錄查詢
  const latestEscrowByUserId = {}
  for (const tx of transactions) {
    if (tx.type !== 'escrow') continue
    // transactions 已依 createdAt 由新到舊排序，每位成員第一次出現的就是最新一筆
    latestEscrowByUserId[tx.userId] ??= tx
  }

  return {
    content: (
      <div className="p-5">
        {transactionsLoading ? (
          <p className="py-8 text-center text-sm text-ink-3">載入中…</p>
        ) : members.length === 0 ? (
          <EmptyState icon={Banknote} title="目前尚無成員" />
        ) : (
          <div className="space-y-4">
            {group.escrowTokens > 0 && (
              <EscrowStatusCard tone="info" icon={Banknote} title="目前費用由平台代管中，尚未撥款" amount={group.escrowTokens} />
            )}
            {releasedTotal > 0 && (
              <EscrowStatusCard tone="success" icon={ArrowUpCircle} title="已撥款給你的代管總額" amount={releasedTotal} />
            )}
            <div className="overflow-hidden rounded-xl border border-line">
              {members.map((m, i) => {
                const tx = latestEscrowByUserId[m.userId]
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line-subtle' : ''}`}>
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.userName}</p>
                      {/* 顯示團主按下「接受」的時間（Member.joinedAt），不是申請送出當下實際扣款的時間（tx.createdAt）——
                          代管扣款雖然在申請當下就發生，但對團主來說「入帳」的認知時間點是自己接受申請的那一刻 */}
                      <p className="text-xs text-ink-3">{tx ? `${formatDateTime(m.joinedAtTime)} 代管入帳` : '尚無代管紀錄'}</p>
                    </div>
                    {tx && <span className="shrink-0 text-sm font-bold text-info"><TokenAmount amount={Math.abs(tx.amount)} /></span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    ),
  }
}
