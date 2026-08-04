import { useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useClickOutside } from '../../../../common/utils/hooks'

export default function Field({ label, icon: Icon, required, children, hint, endAdornment, className = '' }) {
  const [showHint, setShowHint] = useState(false)
  const hintRef = useRef(null)
  useClickOutside(showHint, [hintRef], () => setShowHint(false))
  return (
    <div className={className}>
      <span className="mb-2 flex items-center gap-1.5 text-base font-medium text-slate-700">
        {Icon && <Icon size={15} className="shrink-0 text-slate-400" strokeWidth={1.5} />}
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
            <span className={`pointer-events-none absolute left-0 top-full z-10 mt-1.5 w-max max-w-[16rem] rounded-lg bg-neutral-900 px-2.5 py-1.5 text-sm font-normal leading-relaxed text-white shadow-popover transition-opacity group-hover/hint:opacity-100 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
              {hint}
            </span>
          </span>
        )}
        {endAdornment && <span className="ml-auto">{endAdornment}</span>}
      </span>
      {children}
    </div>
  )
}
