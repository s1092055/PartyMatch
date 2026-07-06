import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { TokenBadge } from './TokenAmount'
import { useAuthStore } from '../stores/useAuthStore'
import { toast } from '../utils/toast'

const TOPUP_OPTIONS = [100, 300, 500, 1000, 3000, 5000]

export default function TopupModal({ isOpen, onClose }) {
  const tokenBalance = useAuthStore(s => s.user?.tokenBalance ?? 0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  async function handleTopup() {
    if (!selected || loading) return
    setLoading(true)
    try {
      await useAuthStore.getState().topup(selected)
      setSelected(null)
      onClose()
    } catch (err) {
      toast(err?.message ?? '儲值失敗，請稍後再試', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setSelected(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="代幣儲值" sub>
      <div className="px-5 py-4 flex flex-col gap-5">

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
                  <TokenBadge className={selected === amt ? 'bg-white/30' : ''} />
                  {amt.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-ink-4">1 PM = 1 TWD（模擬儲值，非真實扣款）</p>

        <div className="flex gap-3">
          <Button variant="ghost" size="md" className="flex-1 border border-line" onClick={handleClose}>
            取消
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            disabled={!selected || loading}
            onClick={handleTopup}
          >
            {loading ? '處理中…' : selected ? `儲值 ${selected.toLocaleString()} PM` : '請選擇金額'}
          </Button>
        </div>

      </div>
    </Modal>
  )
}
