import { createPortal } from 'react-dom'
import { useScrollLock } from '../utils/hooks'

export default function ConfirmDialog({ title, message, confirmLabel, danger = false, onConfirm, onCancel }) {
  useScrollLock(true)
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-extrabold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors ${
              danger ? 'bg-danger hover:opacity-90' : 'bg-brand hover:bg-brand-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
