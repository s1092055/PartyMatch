import { CheckCircle2 } from 'lucide-react'
import Modal from '../../../shared/ui/primitives/Modal'
import Button from '../../../shared/ui/primitives/Button'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import TokenAmount from '../../../shared/ui/TokenAmount'
import { calcDisplayPrice, calcDisplayCycle } from '../../../shared/utils/pricingUtils'

export default function ApplyModal({
  group,
  isOpen, onClose,
  applyMessage, setApplyMessage,
  applyAgreed, setApplyAgreed,
  applySubmitted,
  applying,
  onApply,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={applySubmitted ? undefined : '申請加入群組'}
      sub
      instantEntry
      showHeader={!applySubmitted}
      maxWidth="max-w-md"
    >
      {applySubmitted ? (
        <div className="animate-step-slide-up flex flex-col items-center gap-4 px-6 py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success-subtle flex items-center justify-center">
            <CheckCircle2 size={30} className="text-success" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-ink">申請已送出！</p>
            <p className="text-sm text-ink-3">等待團主審核後即可加入，請留意通知。</p>
          </div>
          <Button variant="primary" size="md" className="mt-2 min-w-[7rem]" onClick={onClose}>確認</Button>
        </div>
      ) : (
        <div className="animate-step-slide-up flex flex-col gap-4 p-5">
          <div className="rounded-xl border border-line bg-raised/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <ServiceLogo serviceId={group.serviceId} size={32} className="shrink-0 rounded-xl" />
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
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              申請備註<span className="ml-1 text-ink-4 font-normal">（選填）</span>
            </label>
            <textarea
              value={applyMessage}
              onChange={e => setApplyMessage(e.target.value)}
              rows={3}
              placeholder="可以介紹自己或說明申請原因…"
              className="field w-full resize-none px-3 py-2.5 text-sm placeholder:text-ink-4 focus:border-line focus:shadow-none"
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
            <Button variant="ghost" size="md" className="flex-1 border border-line" onClick={onClose}>取消</Button>
            <Button variant="primary" size="md" className="flex-1" disabled={!applyAgreed} loading={applying} onClick={onApply}>送出申請</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
