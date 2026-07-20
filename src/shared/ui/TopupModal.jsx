import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownLeft, ChevronLeft, Clock, Coins, Lock, TrendingUp, X } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import { fetchTokenBalance } from '../api/tokensApi'
import { TokenBadge } from './TokenAmount'
import { toast } from '../utils/toast'
import { toISODate } from '../utils/date'
import { useScrollLock } from '../utils/hooks'

const TX_CONFIG = {
  topup:   { label: '儲值',     icon: ArrowDownLeft, color: 'text-success'      },
  escrow:  { label: '代管扣除', icon: Lock,          color: 'text-warning-text' },
  release: { label: '款項撥付', icon: TrendingUp,    color: 'text-success'      },
  refund:  { label: '退款',     icon: ArrowDownLeft, color: 'text-brand'        },
}
function getTxConfig(type) {
  return TX_CONFIG[type] ?? { label: type, icon: Coins, color: 'text-ink-3' }
}

const TOPUP_OPTIONS = [100, 300, 500, 1000, 3000, 5000]

export default function TopupModal({ isOpen, onClose }) {
  const tokenBalance = useAuthStore(s => s.user?.tokenBalance ?? 0)
  const [loading, setLoading]       = useState(false)
  const [selected, setSelected]     = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading]   = useState(false)

  useScrollLock(!!isOpen)

  // 關閉時重置選取狀態：於 render 期間比對前一次 isOpen 並直接呼叫 setState
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (!isOpen) { setSelected(null); setShowHistory(false) }
  }

  useEffect(() => {
    if (!isOpen) return
    // 開啟時載入交易紀錄，載入中旗標需在發出請求前同步設定
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTxLoading(true)
    fetchTokenBalance()
      .then(res => setTransactions(res.transactions ?? []))
      .catch(console.error)
      .finally(() => setTxLoading(false))
  }, [isOpen, tokenBalance])

  async function handleTopup() {
    if (!selected || loading) return
    setLoading(true)
    try {
      await useAuthStore.getState().topup(selected)
      toast('儲值成功', 'success')
      setSelected(null)
      handleClose()
    } catch (err) {
      toast(err?.message ?? '儲值失敗，請稍後再試', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() { setShowHistory(false); onClose() }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/50 animate-backdrop-in" onClick={handleClose} />

      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-modal-in"
           style={{ height: 'min(92vh, 560px)' }}>

        {/* Slide track — 200% wide, two equal panels */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ width: '200%', transform: showHistory ? 'translateX(-50%)' : 'translateX(0)' }}
        >

          {/* ── Panel 1: 儲值 ── */}
          <div className="flex w-1/2 min-w-0 flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <TokenBadge />
                <h2 className="text-base font-extrabold text-ink">PM幣儲值</h2>
              </div>
              <button onClick={handleClose} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between rounded-xl bg-brand-subtle px-4 py-3">
                  <span className="text-sm font-medium text-brand">目前餘額</span>
                  <div className="flex items-center gap-1.5">
                    <TokenBadge />
                    <span className="text-xl font-black text-brand">{tokenBalance.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-2.5 text-xs font-medium text-ink-3">選擇儲值金額</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TOPUP_OPTIONS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setSelected(amt)}
                        className={`rounded-xl border py-3 text-sm font-bold transition-colors ${
                          selected === amt
                            ? 'border-brand bg-brand text-white'
                            : 'border-line bg-surface text-ink hover:border-brand hover:text-brand'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <TokenBadge />
                          {amt.toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-center text-xs text-ink-4">1 PM = 1 TWD（模擬儲值，非真實扣款）</p>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-line px-5 py-4 flex flex-col gap-2">
              <div className="flex gap-3">
                <button onClick={handleClose} className="btn btn-ghost flex-1">取消</button>
                <button
                  disabled={!selected || loading}
                  onClick={handleTopup}
                  className="btn btn-primary flex-1"
                >
                  {loading ? '處理中…' : selected ? `儲值 ${selected.toLocaleString()} PM` : '請選擇金額'}
                </button>
              </div>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-ink-4 transition-colors hover:bg-raised hover:text-ink"
              >
                <Clock size={13} />
                查看交易紀錄
              </button>
            </div>
          </div>

          {/* ── Panel 2: 交易紀錄 ── */}
          <div className="flex w-1/2 min-w-0 flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-4">
              <button
                onClick={() => setShowHistory(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <Coins size={15} className="text-ink-3" />
              <span className="flex-1 font-extrabold text-ink">交易紀錄</span>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {txLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-10 text-center text-sm text-ink-4">尚無交易紀錄</div>
              ) : (
                <div className="divide-y divide-line-subtle">
                  {transactions.map(tx => {
                    const cfg = getTxConfig(tx.type)
                    const Icon = cfg.icon
                    const isNegative = tx.amount < 0
                    const absAmount  = Math.abs(tx.amount)
                    return (
                      <div
                        key={tx.id}
                        className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${tx.relatedGroupId ? 'cursor-pointer hover:bg-raised' : ''}`}
                        onClick={tx.relatedGroupId ? () => {
                          handleClose()
                          window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: tx.relatedGroupId } }))
                        } : undefined}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised ${cfg.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink">{cfg.label}</p>
                            {tx.relatedGroup && (
                              <span className="max-w-[100px] truncate text-xs text-ink-4">
                                {tx.relatedGroup.service?.name ?? tx.relatedGroup.planName}
                              </span>
                            )}
                          </div>
                          {tx.note && <p className="mt-0.5 truncate text-xs text-ink-4">{tx.note}</p>}
                          <p className="text-xs text-ink-4">{toISODate(tx.createdAt)}</p>
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
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
