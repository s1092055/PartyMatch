import { createPortal } from 'react-dom'
import { FileText, X } from 'lucide-react'
import { useScrollLock } from '../../utils/hooks'
import Avatar from './Avatar'

export default function DisputeReasonDialog({ reporterName, reporterAvatarInitial, reporterAvatarColor, reason, evidenceUrl, onClose }) {
  useScrollLock(true)

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <FileText size={16} strokeWidth={1.5} /> 回報原因
          </h3>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-raised p-3">
          <Avatar initial={reporterAvatarInitial} color={reporterAvatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            {reporterName && (
              <p className="mb-1 text-xs font-semibold text-ink-3">{reporterName}</p>
            )}
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">
              {reason || '未提供詳細說明'}
            </p>
          </div>
        </div>
        {evidenceUrl && (
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
          >
            查看附件
          </a>
        )}
      </div>
    </div>,
    document.body,
  )
}
