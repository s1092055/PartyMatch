import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/input'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import TokenAmount from '../../../components/ui/TokenAmount'
import ConfirmActionDialog from '../../../components/ui/ConfirmActionDialog'
import { calcDisplayPrice, calcDisplayCycle } from '../../../common/utils/pricingUtils'

export default function ApplyModal({
  group,
  isOpen, onClose,
  applyMessage, setApplyMessage,
  applyAgreed, setApplyAgreed,
  applying,
  onApply,
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  function handleCancelClick() {
    if (applyMessage.trim()) setConfirmDiscard(true)
    else onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) handleCancelClick() }}>
      <DialogContent variant="panel" maxWidth="max-w-md" instant>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText size={16} strokeWidth={1.5} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">申請加入群組</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>申請加入群組</DialogDescription>
        <DialogBody>
        <div className="animate-step-slide-up flex flex-col gap-4 p-5">
          <div className="rounded-lg border border-line bg-raised/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <ServiceLogo serviceId={group.serviceId} size={32} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink truncate">{group.serviceName}</p>
                <p className="text-xs text-ink-3">{group.planName}</p>
              </div>
              <p className="shrink-0 text-base font-extrabold text-brand">
                <TokenAmount
                  amount={calcDisplayPrice(group.pricePerSeat, group.billingCycle)}
                  cycle={calcDisplayCycle(group.billingCycle)}
                />
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="apply-message" className="block text-xs font-medium text-ink-2 mb-1.5">
              申請備註<span className="ml-1 text-ink-4 font-normal">（選填）</span>
            </label>
            <Textarea
              id="apply-message"
              value={applyMessage}
              onChange={e => setApplyMessage(e.target.value)}
              rows={3}
              placeholder="可以介紹自己或說明申請原因…"
              className="resize-none"
            />
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyAgreed}
              onChange={e => setApplyAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-brand cursor-pointer shrink-0"
            />
            <span className="min-w-0 text-sm text-ink-2">我已閱讀並同意此群組的所有規則與付款條件</span>
          </label>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" size="md" className="flex-1 border border-line" onClick={handleCancelClick}>取消</Button>
            <Button variant="default" size="md" className="flex-1" disabled={!applyAgreed} loading={applying} onClick={onApply}>送出申請</Button>
          </div>
        </div>
        </DialogBody>
      </DialogContent>

      {confirmDiscard && (
        <ConfirmActionDialog
          title="放棄這則申請備註？"
          message="尚未送出申請，關閉後填寫的備註內容將會遺失。"
          confirmLabel="放棄"
          danger
          onConfirm={() => { setConfirmDiscard(false); onClose() }}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </Dialog>
  )
}
