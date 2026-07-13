import { useState } from 'react'
import { CheckCircle2, Clock, History } from 'lucide-react'
import Avatar from '../../../shared/ui/Avatar'
import CreditScoreBadge from '../../../shared/ui/CreditScoreBadge'
import Modal from '../../../shared/ui/Modal'

export default function ProfileHeaderCard({ user }) {
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <div className="card mb-5 flex flex-col items-center gap-4 p-5 md:flex-row md:items-center md:justify-between md:gap-4">
      <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:gap-4 md:text-left">
        <div className="relative shrink-0">
          <Avatar
            initial={user.avatarInitial ?? (user.displayName ?? '使')[0]}
            color={user.avatarColor}
            size="xl"
          />
          {user.isVerified && (
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
              <CheckCircle2 size={18} className="text-brand" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h2 className="text-xl font-bold text-ink">{user.displayName}</h2>
            {user.isVerified && (
              <span className="badge badge-blue">
                <CheckCircle2 size={11} /> 已驗證
              </span>
            )}
          </div>
          <p className="text-sm text-ink-3">{user.email}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1.5 md:items-end">
        <CreditScoreBadge score={user.creditScore} size="md" />
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-1 text-xs font-bold text-ink-3 transition-colors hover:text-ink"
        >
          <History size={12} strokeWidth={1.5} />
          查看紀錄
        </button>
      </div>

      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="max-w-md"
        title="信用分數紀錄"
      >
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-raised">
            <Clock size={22} className="text-ink-3" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink">尚無信用分數異動紀錄</p>
            <p className="text-xs text-ink-3">加分與扣分紀錄將顯示在這裡</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
