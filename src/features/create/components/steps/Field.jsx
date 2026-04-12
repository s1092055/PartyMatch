import { useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useClickOutside } from '../../../../common/utils/hooks'

export default function Field({ label, icon: Icon, required, children, hint, endAdornment, className = '', htmlFor }) {
  const [showHint, setShowHint] = useState(false)
  const hintRef = useRef(null)
  useClickOutside(showHint, [hintRef], () => setShowHint(false))
  const LabelTag = htmlFor ? 'label' : 'span'
  return (
    <div className={className}>
      <LabelTag htmlFor={htmlFor} className="mb-2 flex items-center gap-1.5 text-base font-medium text-ink-2">
        {Icon && <Icon size={15} className="shrink-0 text-ink-4" strokeWidth={1.5} />}
        {label}
        {required && <span className="ml-0.5 text-danger-text">*</span>}
        {hint && (
          <span ref={hintRef} className="group/hint relative inline-flex">
            <button
              type="button"
              onClick={() => setShowHint(v => !v)}
              className="text-ink-4"
              aria-label="說明"
            >
              <AlertCircle strokeWidth={1.5} size={16} />
            </button>
            <span className={`pointer-events-none absolute left-0 top-full z-10 mt-1.5 w-max max-w-[16rem] rounded-lg bg-ink px-2.5 py-1.5 text-sm font-normal leading-relaxed text-canvas shadow-popover transition-opacity group-hover/hint:opacity-100 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
              {hint}
            </span>
          </span>
        )}
        {endAdornment && <span className="ml-auto">{endAdornment}</span>}
      </LabelTag>
      {children}
    </div>
  )
}
