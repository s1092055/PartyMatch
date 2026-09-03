import { CheckCircle2 } from 'lucide-react'
import { Avatar } from './avatar'
import { Badge } from './badge'
import { PresenceDot } from '../../common/layout/components/navShared'
import { useAuthStore } from '../../common/stores/useAuthStore'

export default function ProfileHeaderCard({ user }) {
  const presenceStatus = useAuthStore(s => s.user?.presenceStatus ?? 'online');

  return (
    <div className="mb-5 flex flex-col items-center gap-4 p-5 md:flex-row">
      <div className="relative shrink-0">
        <Avatar initial={user.avatarInitial} color={user.avatarColor} size="xl" />
        {user.isVerified && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow">
            <CheckCircle2 strokeWidth={1.5} size={18} className="text-brand" />
          </div>
        )}
        <PresenceDot status={presenceStatus} className="absolute -bottom-0.5 -right-0.5 block h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-center md:text-left">
        <div className="mb-0.5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <h2 className="text-xl font-bold text-ink">{user.displayName}</h2>
          {user.isVerified && (
            <Badge>
              <CheckCircle2 strokeWidth={1.5} size={11} /> 已驗證
            </Badge>
          )}
        </div>
        <p className="text-sm text-ink-3">{user.email}</p>
      </div>
    </div>
  )
}
