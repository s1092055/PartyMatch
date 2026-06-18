import { useState } from 'react'
import { CheckCircle2, CreditCard, Lock, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import ServiceLogo from '../../../shared/ui/ServiceLogo'

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`
}

function InputField({ label, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink-3">{label}</label>
      <input
        id={id}
        className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm font-medium text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand focus:ring-1 focus:ring-brand"
        {...props}
      />
    </div>
  )
}

export default function PaymentModal({ isOpen, onClose, sub, onSuccess }) {
  const [name, setName]         = useState('測試持卡人')
  const [card, setCard]         = useState('4242 4242 4242 4242')
  const [expiry, setExpiry]     = useState('12 / 28')
  const [cvv, setCvv]           = useState('123')
  const [success, setSuccess]   = useState(false)

  if (!isOpen || !sub) return null

  const canSubmit = name.trim() && card.replace(/\s/g, '').length === 16 && expiry.length >= 4 && cvv.length >= 3

  function handleConfirm() {
    if (!canSubmit) return
    onSuccess?.()
    setSuccess(true)
  }

  function handleClose() {
    setSuccess(false)
    setName('測試持卡人')
    setCard('4242 4242 4242 4242')
    setExpiry('12 / 28')
    setCvv('123')
    onClose()
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/60" onClick={handleClose} />
      <div className="pointer-events-none fixed inset-0 z-[71] flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-fade-in-up">

          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-brand" />
              <span className="font-extrabold text-ink">確認付款</span>
            </div>
            <button
              onClick={handleClose}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle">
                <CheckCircle2 size={36} className="text-success" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-ink">付款成功</p>
                <p className="mt-1.5 text-sm text-ink-3">已通知團主確認付款，請等待確認</p>
              </div>
              <button
                onClick={handleClose}
                className="mt-2 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              >
                完成
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-raised px-4 py-3">
                <ServiceLogo serviceId={sub.serviceId} size={36} className="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{sub.serviceName}</p>
                  <p className="text-xs text-ink-3">{sub.planName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-ink">NT${sub.pricePerSeat}</p>
                  <p className="text-xs text-ink-4">/席/月</p>
                </div>
              </div>

              <div className="space-y-4" autoComplete="off">
                <InputField
                  label="持卡人姓名"
                  id="pay-name"
                  placeholder="與信用卡上相同"
                  autoComplete="off"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <InputField
                  label="卡號"
                  id="pay-card"
                  placeholder="0000 0000 0000 0000"
                  autoComplete="off"
                  value={card}
                  onChange={e => setCard(formatCardNumber(e.target.value))}
                  inputMode="numeric"
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="有效期限"
                    id="pay-expiry"
                    placeholder="MM / YY"
                    autoComplete="off"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    inputMode="numeric"
                  />
                  <InputField
                    label="安全碼"
                    id="pay-cvv"
                    placeholder="CVV"
                    autoComplete="off"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    type="password"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!canSubmit}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Lock size={14} /> 確認付款 NT${sub.pricePerSeat}
              </button>
              <p className="mt-2.5 text-center text-xs text-ink-4">此為模擬付款，不會產生真實扣款</p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
