import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/input'
import ConfirmActionDialog from '../../../components/ui/ConfirmActionDialog'
import { toast } from '../../../common/utils/toast'
import { useGroupStore } from '../../../common/stores/useGroupStore'

export default function DisputeAdjudicateForm({ dispute, onResolved }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const adjudicateGroup = useGroupStore(s => s.adjudicateGroup)

  const amountNum = amount === '' ? null : Number(amount)
  const amountValid = amountNum !== null && Number.isInteger(amountNum) && amountNum >= 0 && amountNum <= dispute.seatCost
  const hostReleasePreview = amountValid ? dispute.escrowTokens - amountNum : null

  async function handleConfirm() {
    setConfirming(false)
    setLoading(true)
    try {
      await adjudicateGroup(dispute.groupId, { memberRefundAmount: amountNum, reason: reason.trim() })
      toast('裁定完成', 'success')
      setAmount('')
      setReason('')
      onResolved()
    } catch (err) {
      toast(err?.message ?? '裁定失敗', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-line p-3">
      <p className="mb-3 text-xs font-semibold text-ink-3">裁定結果</p>

      <div className="mb-3 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1 rounded-lg text-xs" onClick={() => setAmount(String(dispute.seatCost))}>
          成員全額退款
        </Button>
        <Button variant="secondary" size="sm" className="flex-1 rounded-lg text-xs" onClick={() => setAmount('0')}>
          團主全額撥款
        </Button>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold text-ink-3">退款給成員的金額（上限 {dispute.seatCost} PM）</label>
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder={`0 ~ ${dispute.seatCost}`}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-4 focus:ring-brand-subtle"
        />
        {amount !== '' && !amountValid && (
          <p className="mt-1 text-xs text-danger">請輸入 0 ~ {dispute.seatCost} 之間的整數</p>
        )}
        {amountValid && (
          <p className="mt-1 text-xs text-ink-4">團主將撥款 {hostReleasePreview} PM</p>
        )}
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold text-ink-3">裁定說明</label>
        <Textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="請填寫裁定原因，將發送給雙方"
        />
      </div>

      <Button
        variant="destructive"
        disabled={loading || !amountValid || !reason.trim()}
        onClick={() => setConfirming(true)}
        className="w-full rounded-lg"
      >
        {loading ? '處理中…' : '送出裁定'}
      </Button>

      {confirming && (
        <ConfirmActionDialog
          title="確認送出裁定？"
          message={`成員退款 ${amountNum} PM、團主撥款 ${hostReleasePreview} PM，此操作無法復原。`}
          confirmLabel="確認裁定"
          danger
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
