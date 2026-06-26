import { AlertTriangle } from 'lucide-react'
import Modal from '../../../shared/ui/Modal'
import Avatar from '../../../shared/ui/Avatar'
import { ISSUE_TYPES } from '../data/paymentIssueTypes'

export default function ReportPaymentModal({ member, onClose, onSubmit, issueType, setIssueType, issueNote, setIssueNote }) {
  return (
    <Modal
      isOpen={!!member}
      onClose={onClose}
      title="回報付款問題"
      icon={<AlertTriangle size={18} className="text-warning-text" />}
      maxWidth="max-w-lg"
      height="min(calc(100vh - 2rem), 540px)"
      sub
      footer={
        <button
          onClick={onSubmit}
          disabled={!issueType || (issueType === 'other' && !issueNote.trim())}
          className="flex-1 rounded-xl bg-warning py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          發送通知
        </button>
      }
    >
      {member && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-raised px-4 py-3">
            <Avatar initial={member.userAvatarInitial} color={member.userAvatarColor} size="sm" />
            <p className="text-sm font-semibold text-ink">{member.userName}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-ink-2">選擇問題類型</p>
            {ISSUE_TYPES.map(t => (
              <label
                key={t.key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                  issueType === t.key
                    ? 'border-warning/60 bg-warning-subtle'
                    : 'border-line hover:bg-raised'
                }`}
              >
                <input
                  type="radio"
                  checked={issueType === t.key}
                  onChange={() => setIssueType(t.key)}
                  className="mt-0.5 shrink-0 accent-warning-text"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">{t.label}</p>
                  <p className="text-xs text-ink-3">{t.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {issueType && (
            <div>
              <textarea
                rows={3}
                placeholder={issueType === 'other' ? '請描述問題內容...' : '補充說明（選填）'}
                value={issueNote}
                onChange={e => setIssueNote(e.target.value)}
                className="w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              {issueType === 'other' && !issueNote.trim() && (
                <p className="mt-1 text-xs text-warning-text">其他問題請填寫說明內容</p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
