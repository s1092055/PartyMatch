import { useEffect, useState } from 'react'
import { ArrowDownLeft, Coins, Lock, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'
import { fetchTokenBalance } from '../../../../shared/api/tokensApi'
import { toISODate } from '../../../../shared/utils/date'
import TopupModal from '../../../../shared/ui/TopupModal'

const TYPE_CONFIG = {
  topup:   { label: '儲值',     icon: ArrowDownLeft, color: 'text-success'      },
  escrow:  { label: '代管扣除', icon: Lock,          color: 'text-warning-text' },
  release: { label: '款項撥付', icon: TrendingUp,    color: 'text-success'      },
  refund:  { label: '退款',     icon: ArrowDownLeft, color: 'text-brand'        },
}

function getConfig(type) {
  return TYPE_CONFIG[type] ?? { label: type, icon: Coins, color: 'text-ink-3' }
}

export default function TokenTab() {
  const tokenBalance = useAuthStore(s => s.user?.tokenBalance ?? 0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [topupOpen, setTopupOpen] = useState(false)

  useEffect(() => {
    fetchTokenBalance()
      .then(res => setTransactions(res.transactions ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tokenBalance]) // 儲值後 tokenBalance 變動時自動重新撈

  return (
    <div className="space-y-4">

      {/* 餘額卡片 */}
      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-ink-3 mb-1">目前代幣餘額</p>
          <p className="text-3xl font-black text-ink">
            {tokenBalance.toLocaleString()}
            <span className="ml-1.5 text-base font-semibold text-ink-3">PM</span>
          </p>
          <p className="text-xs text-ink-4 mt-1">1 PM = 1 TWD</p>
        </div>
        <button
          onClick={() => setTopupOpen(true)}
          className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors"
        >
          加值
        </button>
      </div>

      {/* 交易紀錄 */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-line">
          <Coins size={15} className="text-ink-3" />
          <span className="text-sm font-semibold text-ink-2">交易紀錄</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-4">尚無交易紀錄</div>
        ) : (
          <div className="divide-y divide-line-subtle">
            {transactions.map(tx => {
              const cfg = getConfig(tx.type)
              const Icon = cfg.icon
              const isNegative = tx.amount < 0
              const absAmount = Math.abs(tx.amount)
              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised ${cfg.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{cfg.label}</p>
                      {tx.relatedGroup && (
                        <span className="text-xs text-ink-4 truncate max-w-[120px]">
                          {tx.relatedGroup.service?.name ?? tx.relatedGroup.planName}
                        </span>
                      )}
                    </div>
                    {tx.note && <p className="text-xs text-ink-4 mt-0.5 truncate">{tx.note}</p>}
                    <p className="text-xs text-ink-4">{toISODate(new Date(tx.createdAt))}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold tabular-nums ${isNegative ? 'text-danger' : cfg.color}`}>
                    {isNegative ? `−${absAmount.toLocaleString()}` : `+${absAmount.toLocaleString()}`} PM
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  )
}
