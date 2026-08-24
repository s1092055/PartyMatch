import { useEffect, useState } from 'react'
import { ArrowDownLeft, ChevronLeft, Clock, Coins, Lock, TrendingUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from './dialog'
import { Button } from './button'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { fetchTokenBalance } from '../../common/api/tokensApi'
import { TokenBadge } from './TokenAmount'
import { toast } from '../../common/utils/toast'
import { toISODate } from '../../common/utils/date'

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
const MIN_AMOUNT = 1
const MAX_AMOUNT = 100000

export default function TopupModal({ isOpen, onClose }) {
  const tokenBalance = useAuthStore(s => s.user?.tokenBalance ?? 0)
  const [loading, setLoading]       = useState(false)
  const [selected, setSelected]     = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading]   = useState(false)

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (!isOpen) { setSelected(null); setCustomAmount(''); setShowHistory(false) }
  }

  const customAmountNum = customAmount === '' ? null : Number(customAmount)
  const customAmountValid = customAmountNum !== null
    && Number.isInteger(customAmountNum)
    && customAmountNum >= MIN_AMOUNT
    && customAmountNum <= MAX_AMOUNT
  const activeAmount = selected ?? (customAmountValid ? customAmountNum : null)

  function selectPreset(amt) {
    setSelected(amt)
    setCustomAmount('')
  }

  function handleCustomAmountChange(raw) {
    const digitsOnly = raw.replace(/[^0-9]/g, '')
    setCustomAmount(digitsOnly)
    setSelected(null)
  }

  useEffect(() => {
    if (!isOpen) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTxLoading(true);
    fetchTokenBalance()
      .then(res => setTransactions(res.transactions ?? []))
      .catch(console.error)
      .finally(() => setTxLoading(false))
  }, [isOpen, tokenBalance])

  async function handleTopup() {
    if (!activeAmount || loading) return
    setLoading(true)
    try {
      await useAuthStore.getState().topup(activeAmount)
      toast('儲值成功', 'success')
      setSelected(null)
      setCustomAmount('')
      handleClose()
    } catch (err) {
      toast(err?.message ?? '儲值失敗，請稍後再試', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() { setShowHistory(false); onClose() }

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent maxWidth="max-w-sm" height="min(92dvh, 560px)">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {showHistory ? (
              <button
                onClick={() => setShowHistory(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                aria-label="返回"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
            ) : (
              <TokenBadge />
            )}
            <DialogTitle>{showHistory ? '交易紀錄' : 'PM幣儲值'}</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>PM幣儲值</DialogDescription>
        <DialogBody>
      <div key={showHistory ? 'history' : 'main'} className="flex min-h-0 flex-1 flex-col animate-step-slide-up">
        {showHistory ? (
          txLoading ? (
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
          )
        ) : (
          <div className="flex flex-col gap-5 px-5 py-4">
            <div className="flex items-center justify-between rounded-lg bg-brand-subtle px-4 py-3">
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
                    onClick={() => selectPreset(amt)}
                    className={`rounded-lg border py-3 text-sm font-bold transition-colors ${
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

            <div>
              <p className="mb-2.5 text-xs font-medium text-ink-3">或自行輸入金額</p>
              <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-[border-color,box-shadow] focus-within:ring-4 focus-within:ring-brand-subtle ${
                customAmount && !customAmountValid
                  ? 'border-danger'
                  : customAmountValid
                    ? 'border-brand'
                    : 'border-line'
              }`}>
                <TokenBadge className="shrink-0" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={e => handleCustomAmountChange(e.target.value)}
                  placeholder={`輸入金額（${MIN_AMOUNT}–${MAX_AMOUNT.toLocaleString()}）`}
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none placeholder:font-normal placeholder:text-ink-4"
                />
              </div>
              {customAmount && !customAmountValid && (
                <p className="mt-1.5 text-xs text-danger">
                  請輸入 {MIN_AMOUNT}–{MAX_AMOUNT.toLocaleString()} 之間的整數
                </p>
              )}
            </div>

            <p className="text-center text-xs text-ink-4">1 PM = 1 TWD（模擬儲值，非真實扣款）</p>
          </div>
        )}
      </div>
        </DialogBody>
        {!showHistory && (
          <DialogFooter className="flex-col gap-2">
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1">取消</Button>
              <Button
                disabled={!activeAmount || loading}
                onClick={handleTopup}
                className="flex-1"
              >
                {loading ? '處理中…' : activeAmount ? `儲值 ${activeAmount.toLocaleString()} PM` : '請選擇金額'}
              </Button>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-ink-4 transition-colors hover:bg-raised hover:text-ink"
            >
              <Clock size={13} />
              查看交易紀錄
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
