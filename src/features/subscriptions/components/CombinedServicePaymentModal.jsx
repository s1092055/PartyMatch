import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ClipboardEdit, CreditCard, ImagePlus, X } from 'lucide-react'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import { uploadPaymentProof } from '../../../shared/api/storageApi'
import { getCurrentUser } from '../../../shared/stores/authStore'

export default function CombinedServicePaymentModal({ isOpen, onClose, group, member, sub, onSubmit }) {
  const hasServiceInfoIssue = !!member?.serviceInfoIssueNote
  const hasServiceInfo      = !!member?.serviceInfo?.email && !hasServiceInfoIssue
  const hasPaymentIssue     = member?.paymentStatus === 'payment_failed'
  const needsEmail          = !hasServiceInfo

  const [email, setEmail]       = useState(member?.serviceInfo?.email ?? '')
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [amount, setAmount]     = useState(String(sub?.pricePerSeat ?? ''))
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  if (!isOpen || !sub) return null

  const parsedAmount = Number(amount)
  const canSubmit    = file && parsedAmount > 0 && (!needsEmail || email.trim())

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

  function handleClose() {
    setEmail(member?.serviceInfo?.email ?? '')
    setFile(null)
    setPreview(null)
    setAmount(String(sub?.pricePerSeat ?? ''))
    setUploading(false)
    onClose()
  }

  async function handleSubmit() {
    if (!canSubmit || uploading) return
    setUploading(true)
    try {
      const user = getCurrentUser()
      const proofUrl = await uploadPaymentProof(sub.groupId, user?.id ?? 'unknown', file)
      const serviceInfoChanged = needsEmail || hasServiceInfoIssue
      await onSubmit({ serviceEmail: email, proofUrl, paidAmount: Number(amount), serviceInfoChanged })
      handleClose()
    } catch (err) {
      console.error('[CombinedServicePaymentModal] submit failed:', err)
      setUploading(false)
    }
  }

  const titleIcon = needsEmail ? <ClipboardEdit size={18} className="text-brand" /> : <CreditCard size={18} className="text-brand" />
  const title     = needsEmail ? '完成加入流程' : '上傳付款憑證'

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/60" onClick={handleClose} />
      <div className="pointer-events-none fixed inset-0 z-[71] flex items-center justify-center p-4">
        <div
          className="pointer-events-auto flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-fade-in-up"
          style={{ height: '580px', maxHeight: 'calc(100vh - 2rem)' }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
            <div className="flex items-center gap-2">
              {titleIcon}
              <span className="font-extrabold text-ink">{title}</span>
            </div>
            <button
              onClick={handleClose}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

          <>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none p-5 space-y-4">
                {hasServiceInfoIssue && (
                  <div className="rounded-xl border border-warning/40 bg-warning-subtle px-4 py-3">
                    <p className="text-xs font-semibold text-warning-text">團主回報帳號有誤</p>
                    <p className="mt-1 text-xs text-ink-2">{member.serviceInfoIssueNote}</p>
                  </div>
                )}
                {hasPaymentIssue && (
                  <div className="rounded-xl border border-danger/40 bg-danger-subtle px-4 py-3">
                    <p className="text-xs font-semibold text-danger">付款有誤，請重新上傳</p>
                    {member?.paymentIssueNote && (
                      <p className="mt-1 text-xs text-ink-2">{member.paymentIssueNote}</p>
                    )}
                  </div>
                )}

                {/* 服務帳號 */}
                {needsEmail && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wide text-ink-3">服務帳號</span>
                      <div className="flex-1 border-t border-line-subtle" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-2">
                        {group.serviceName} 帳號（Email）
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      />
                      <p className="mt-1 pl-3.5 text-xs text-ink-4">團主將使用此帳號將你加入訂閱方案</p>
                    </div>
                  </>
                )}

                {/* 付款資訊 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-ink-3">付款資訊</span>
                  <div className="flex-1 border-t border-line-subtle" />
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-raised px-4 py-3">
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

                {(group.paymentAccount || group.paymentMethod) && (
                  <div className="rounded-xl border border-line bg-canvas px-4 py-3 space-y-2">
                    {group.paymentMethod && (
                      <div>
                        <p className="text-xs font-semibold text-ink-3">收款方式</p>
                        <p className="mt-0.5 text-sm text-ink">{group.paymentMethod}</p>
                      </div>
                    )}
                    {group.paymentAccount && (
                      <div>
                        <p className="text-xs font-semibold text-ink-3">收款帳號</p>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm font-semibold text-ink">{group.paymentAccount}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
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
                    <p className="mt-1 text-xs text-warning-text">金額與應付金額不符，請確認</p>
                  )}
                </div>

                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line transition-colors hover:border-brand hover:bg-brand-subtle/20"
                >
                  <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {preview ? (
                    <img src={preview} alt="付款截圖預覽" className="max-h-48 w-full rounded-xl object-contain p-2" />
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
                    className="flex w-full items-center justify-center gap-1 text-xs text-ink-3 transition-colors hover:text-danger"
                  >
                    <X size={12} /> 重新選擇截圖
                  </button>
                )}
              </div>

              <div className="shrink-0 border-t border-line px-6 py-4">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploading ? '上傳中...' : '送出付款憑證'}
                </button>
              </div>
            </>
        </div>
      </div>
    </>,
    document.body
  )
}
