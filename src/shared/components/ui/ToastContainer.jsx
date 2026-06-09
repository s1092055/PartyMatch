import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { subscribeToast } from '../../utils/toast'

const TOAST_DURATION = 4000

const CONFIG = {
  success: { icon: CheckCircle2, iconClass: 'text-success' },
  error:   { icon: AlertCircle,  iconClass: 'text-danger' },
  info:    { icon: Info,         iconClass: 'text-brand' },
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  function remove(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    return subscribeToast(item => {
      setToasts(prev => [...prev, item])
      setTimeout(() => remove(item.id), TOAST_DURATION)
    })
  }, [])

  if (toasts.length === 0) return null

  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map(t => {
        const { icon: Icon, iconClass } = CONFIG[t.type] ?? CONFIG.info
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-72 items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg"
          >
            <Icon size={18} className={`shrink-0 ${iconClass}`} />
            <span className="flex-1 text-sm font-semibold text-ink">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
