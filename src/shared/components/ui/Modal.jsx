import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, titleIcon, maxWidth = 'max-w-md', children }) {
  useEffect(() => {
    if (!isOpen) return
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} card p-0 overflow-hidden`}>
        {(title || titleIcon) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line-subtle">
            <div className="flex items-center gap-2">
              {titleIcon}
              {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-raised text-ink-3 hover:text-ink transition-colors"
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
