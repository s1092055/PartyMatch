import { useRef, useState } from 'react'
import { CheckCircle2, CreditCard, ImagePlus, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import { uploadPaymentProof } from '../../../shared/api/storageApi'
import { getCurrentUser } from '../../../shared/stores/authStore'

export default function PaymentModal({ isOpen, onClose, sub, onSuccess }) {
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState(null)
  const [amount, setAmount]       = useState(String(sub?.pricePerSeat ?? ''))
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess]     = useState(false)
  const inputRef = useRef(null)

  if (!isOpen || !sub) return null

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const parsedAmount = Number(amount)
  const canSubmit = file && parsedAmount > 0

  async function handleConfirm() {
    if (!canSubmit || uploading) return
    setUploading(true)
    try {
      const user = getCurrentUser()
      const proofUrl = await uploadPaymentProof(sub.groupId, user?.id ?? 'unknown', file)
      onSuccess?.(proofUrl, Number(amount))
      setSuccess(true)
    } catch (err) {
      console.error('[PaymentModal] upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  function handleClose() {
    setFile(null)
    setPreview(null)
    setAmount(String(sub?.pricePerSeat ?? ''))
    setUploading(false)
    setSuccess(false)
    onClose()
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/60" onClick={handleClose} />
      <div className="pointer-events-none fixed inset-0 z-[71] flex items-center justify-center p-4">
        <div className="pointer-events-auto flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-fade-in-up" style={{ maxHeight: 'calc(100vh - 2rem)' }}>

          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
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
                <p className="text-xl font-extrabold text-ink">付款截圖已上傳</p>
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
            <>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                {/* 服務資訊 */}
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-raised px-4 py-3">
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

                {/* 付款說明 */}
                <div className="mb-4 rounded-xl border border-line bg-canvas p-4 text-sm text-ink-2 leading-relaxed">
                  <p className="font-semibold text-ink mb-1">付款流程</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-ink-3">
                    <li>依照團主提供的方式完成付款（銀行轉帳、LINE Pay 等）</li>
                    <li>截取付款完成的畫面</li>
                    <li>上傳截圖作為憑證，等待團主確認</li>
                  </ol>
                </div>

                {/* 付款金額 */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold text-ink-2">
                    付款金額
                    <span className="ml-1 font-normal text-ink-4">（應付 NT${sub.pricePerSeat}）</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3.5 py-2.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                    <span className="text-sm font-semibold text-ink-3">NT$</span>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder={String(sub.pricePerSeat)}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none"
                      inputMode="numeric"
                    />
                  </div>
                  {parsedAmount > 0 && parsedAmount !== sub.pricePerSeat && (
                    <p className="mt-1 text-xs text-warning-text">
                      金額與應付金額不符，請確認
                    </p>
                  )}
                </div>

                {/* 截圖上傳區 */}
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line transition-colors hover:border-brand hover:bg-brand-subtle/20"
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {preview ? (
                    <img
                      src={preview}
                      alt="付款截圖預覽"
                      className="max-h-48 w-full rounded-xl object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center">
                      <ImagePlus size={28} className="text-ink-4" />
                      <p className="text-sm font-semibold text-ink-2">點擊或拖曳上傳截圖</p>
                      <p className="text-xs text-ink-4">支援 JPG、PNG、HEIC</p>
                    </div>
                  )}
                </div>

                {preview && (
                  <button
                    onClick={() => { setFile(null); setPreview(null) }}
                    className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-ink-3 transition-colors hover:text-danger"
                  >
                    <X size={12} /> 重新選擇截圖
                  </button>
                )}
              </div>

              <div className="shrink-0 border-t border-line px-6 py-4">
                <button
                  onClick={handleConfirm}
                  disabled={!canSubmit || uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploading ? '上傳中...' : '送出付款憑證'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
