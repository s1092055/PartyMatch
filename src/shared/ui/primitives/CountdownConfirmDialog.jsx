import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../../utils/hooks'

export default function CountdownConfirmDialog({
  title,
  message,
  confirmLabel = '確認',
  danger = false,
  countdownSeconds = 5,
  onConfirm,
  onCancel,
}) {
  const [countdown, setCountdown] = useState(countdownSeconds)

  useScrollLock(true)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const ready = countdown <= 0

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className={`text-base font-extrabold text-ink ${message ? 'mb-2' : 'mb-0'}`}>{title}</h3>
        {message && <p className="text-sm leading-relaxed text-ink-3">{message}</p>}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-raised"
          >
            取消
          </button>
          <button
            onClick={ready ? onConfirm : undefined}
            disabled={!ready}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all ${
              danger
                ? ready ? 'bg-danger hover:opacity-90 hover:-translate-y-0.5' : 'cursor-not-allowed bg-danger/40'
                : ready ? 'bg-brand hover:bg-brand-hover hover:-translate-y-0.5' : 'cursor-not-allowed bg-brand/40'
            }`}
          >
            {ready ? confirmLabel : `${confirmLabel}（${countdown}）`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
