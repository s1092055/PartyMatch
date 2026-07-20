import { CheckCircle2 } from 'lucide-react'
import Avatar from '../../../shared/ui/primitives/Avatar'

export default function ProfileHeaderCard({ user }) {
  return (
    <div className="card mb-5 flex flex-col items-center gap-4 p-5 md:flex-row md:items-center md:gap-4">
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
      <div className="min-w-0 flex-1 text-center md:text-left">
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
  )
}
