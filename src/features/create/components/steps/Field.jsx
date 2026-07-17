import { useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useClickOutside } from '../../../../shared/utils/hooks'

export default function Field({ label, required, children, hint, className = '' }) {
  const [showHint, setShowHint] = useState(false)
  const hintRef = useRef(null)
  useClickOutside(showHint, [hintRef], () => setShowHint(false))
  return (
    <div className={className}>
      <span className="mb-2 flex items-center gap-1.5 text-base font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
        {hint && (
          <span ref={hintRef} className="group/hint relative inline-flex">
            <button
              type="button"
              onClick={() => setShowHint(v => !v)}
              className="text-slate-400"
              aria-label="說明"
            >
              <AlertCircle size={16} />
            </button>
            <span className={`pointer-events-none absolute left-full top-1/2 z-10 ml-1.5 w-max max-w-[16rem] -translate-y-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-sm font-normal leading-relaxed text-white shadow-lg transition-opacity group-hover/hint:opacity-100 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
              {hint}
            </span>
          </span>
        )}
      </span>
      {children}
    </div>
  )
}
