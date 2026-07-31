import { FileText, X } from 'lucide-react'
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription } from './alert-dialog'
import { Avatar } from './avatar'

export default function DisputeReasonDialog({ reporterName, reporterAvatarInitial, reporterAvatarColor, reason, evidenceUrl, onClose }) {
  return (
    <AlertDialog open onOpenChange={v => { if (!v) onClose() }}>
      <AlertDialogContent>
        <div className="mb-3 flex items-center justify-between">
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText size={16} strokeWidth={1.5} /> 回報原因
          </AlertDialogTitle>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <AlertDialogDescription asChild>
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
        </AlertDialogDescription>
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
      </AlertDialogContent>
    </AlertDialog>
  )
}
