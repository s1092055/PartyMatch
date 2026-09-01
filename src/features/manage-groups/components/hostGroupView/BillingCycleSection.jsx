import { useState } from 'react'
import { ArrowUpCircle, Banknote, ChevronDown } from 'lucide-react'
import { Avatar } from '../../../../components/ui/avatar'
import { PresenceDot } from '../../../../common/layout/components/navShared'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../../../components/ui/collapsible'
import EscrowStatusCard from '../../../../components/ui/EscrowStatusCard'
import TokenAmount from '../../../../components/ui/TokenAmount'
import { formatDateTime } from '../../../../common/utils/date'

// 一個 cycle 的成員貢獻列表：不比對目前的成員名單（可能有人已退出/被移除），
// 直接用交易紀錄本身附帶的 user 資料呈現，較舊的期數才能正確顯示已離開的成員
function buildMemberRows(transactions, isCancelled) {
  if (isCancelled) {
    const byUserId = new Map()
    for (const tx of transactions) {
      if (tx.type !== 'refund') continue
      if (!byUserId.has(tx.userId)) byUserId.set(tx.userId, tx)
    }
    return [...byUserId.values()]
  }

  // 同一人同一期可能有多筆 escrow/refund（例如取消申請退款後又重新申請，見 TC-002c），
  // 不能只看「有沒有 escrow 交易」，要算淨額才知道現在是否還被代管中；淨額 <= 0 代表
  // 已經全額退款（取消申請／審核未通過），不該再顯示在代管中名單
  const netByUserId = new Map()
  for (const tx of transactions) {
    if (tx.type !== 'escrow' && tx.type !== 'refund') continue
    const prev = netByUserId.get(tx.userId) ?? { net: 0, latestEscrowTx: null }
    if (tx.type === 'escrow') {
      prev.net += Math.abs(tx.amount)
      if (!prev.latestEscrowTx || tx.createdAt > prev.latestEscrowTx.createdAt) prev.latestEscrowTx = tx
    } else {
      prev.net -= Math.abs(tx.amount)
    }
    netByUserId.set(tx.userId, prev)
  }
  return [...netByUserId.values()].filter(v => v.net > 0 && v.latestEscrowTx).map(v => v.latestEscrowTx)
}

export default function BillingCycleSection({ cycle, isCurrentCycle, transactions: rawTransactions, isCancelled, defaultOpen, pendingApplicantUserIds }) {
  const [open, setOpen] = useState(defaultOpen)

  // 團主還沒點「接受」的申請人，代管金額暫時不算進收款管理（只有本期才可能有待審核申請）
  const transactions = isCurrentCycle && pendingApplicantUserIds?.size
    ? rawTransactions.filter(tx => !(tx.type === 'escrow' && pendingApplicantUserIds.has(tx.userId)))
    : rawTransactions

  const escrowTotal   = transactions.filter(tx => tx.type === 'escrow').reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
  const releasedTotal = transactions.filter(tx => tx.type === 'release').reduce((sum, tx) => sum + tx.amount, 0)
  const refundedTotal = transactions.filter(tx => tx.type === 'refund').reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
  const outstanding   = Math.max(0, escrowTotal - releasedTotal - refundedTotal)

  const statusLabel = isCancelled ? '已退款' : releasedTotal > 0 ? '已撥款' : '代管中'
  const memberRows = buildMemberRows(transactions, isCancelled)

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between gap-2 bg-raised px-4 py-3 text-left">
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              第 {cycle} 期
              {isCurrentCycle && (
                <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-2xs font-semibold text-brand">本期</span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-ink-3">{statusLabel}</span>
              <ChevronDown size={16} strokeWidth={1.5} className={`text-ink-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 border-t border-line px-4 py-3">
            {isCancelled ? (
              refundedTotal > 0 && (
                <EscrowStatusCard tone="success" icon={ArrowUpCircle} title="群組已解散，代管金額已退回成員" amount={refundedTotal} />
              )
            ) : (
              <>
                {outstanding > 0 && (
                  <EscrowStatusCard tone="info" icon={Banknote} title="本期費用由平台代管中" amount={outstanding} />
                )}
                {releasedTotal > 0 && (
                  <EscrowStatusCard tone="success" icon={ArrowUpCircle} title="已撥款給你的代管總額" amount={releasedTotal} />
                )}
              </>
            )}
            <div className="overflow-hidden rounded-lg border border-line">
              {memberRows.length === 0 ? (
                <p className="px-4 py-3 text-center text-sm text-ink-3">尚無代管紀錄</p>
              ) : memberRows.map((tx, i) => (
                <div key={tx.userId} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line-subtle' : ''}`}>
                  <span className="relative inline-block shrink-0">
                    <Avatar initial={tx.user?.avatarInitial} color={tx.user?.avatarColor} size="sm" />
                    <PresenceDot status={tx.user?.presenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{tx.user?.name ?? '成員'}</p>
                    <p className="text-xs text-ink-3">{formatDateTime(tx.createdAt)} {isCancelled ? '已退回' : '平台代管'}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold ${isCancelled ? 'text-success-text' : 'text-info'}`}>
                    <TokenAmount amount={Math.abs(tx.amount)} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
