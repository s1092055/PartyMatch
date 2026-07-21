import { AlertTriangle } from 'lucide-react'
import Modal from '../../../../shared/ui/primitives/Modal'
import Avatar from '../../../../shared/ui/primitives/Avatar'
import { getServiceInfoSummary } from '../../../../shared/utils/serviceInfoFields'

export default function ReportServiceIssueModal({ member, sharingMethod, onClose, note, setNote, onSubmit }) {
  return (
    <Modal
      isOpen={!!member}
      onClose={onClose}
      title="回報帳號問題"
      icon={<AlertTriangle size={18} className="text-warning-text" />}
      maxWidth="max-w-sm"
      sub
      footer={
        <button
          onClick={onSubmit}
          disabled={!note.trim()}
          className="flex-1 rounded-xl bg-warning py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          發送通知
        </button>
      }
    >
      {member && (
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-raised px-4 py-3">
            <Avatar initial={member.userAvatarInitial} color={member.userAvatarColor} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{member.userName}</p>
              <p className="text-xs text-ink-3">{getServiceInfoSummary(member.serviceInfo, sharingMethod) ?? '—'}</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-2">說明帳號問題</label>
            <textarea
              rows={3}
              autoFocus
              placeholder="例如：此 Email 無法加入訂閱方案，請更換帳號..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
