import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useScrollLock } from '../../utils/hooks'

export default function Modal({ isOpen, onClose, title, titleIcon, maxWidth = 'max-w-md', children }) {
  useScrollLock(isOpen)

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer bg-black/50" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} card p-0 overflow-hidden`}>
        {(title || titleIcon) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line-subtle">
            <div className="flex items-center gap-2">
              {titleIcon}
              {title && <h2 className="text-base font-extrabold text-ink">{title}</h2>}
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
