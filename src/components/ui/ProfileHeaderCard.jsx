import { CheckCircle2 } from 'lucide-react'
import { Avatar } from './avatar'
import { Badge } from './badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from './dropdown-menu'
import { PresenceDot } from '../../common/layout/components/navShared'
import { PRESENCE_LABELS } from '../../common/layout/components/navConstants'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { toast } from '../../common/utils/toast'

export default function ProfileHeaderCard({ user }) {
  // 頭像旁的狀態點改的是全域 authStore，這裡另外用 hook 直接訂閱，
  // 不吃 user prop 裡那份只在 Modal 開啟當下取一次快照的舊值，才會即時反映
  const presenceStatus = useAuthStore(s => s.user?.presenceStatus ?? 'online')

  // 狀態是手動選擇的，不是自動偵測上下線，要打 API 存到帳號，其他使用者才看得到
  // （群組成員列表、聊天室等）
  async function changePresence(next) {
    if (next === presenceStatus) return
    const result = await useAuthStore.getState().updateProfile({ presenceStatus: next })
    if (!result.ok) toast(result.error ?? '儲存失敗，請稍後再試', 'error')
  }

  return (
    <div className="mb-5 flex flex-col items-center gap-4 p-5 md:flex-row">
      <div className="relative shrink-0">
        <Avatar initial={user.avatarInitial} color={user.avatarColor} size="xl" />
        {user.isVerified && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow">
            <CheckCircle2 size={18} className="text-brand" />
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="設定目前狀態"
              className="absolute -bottom-0.5 -right-0.5 block h-4 w-4 rounded-full border-0 bg-transparent p-0 leading-none"
            >
              <PresenceDot status={presenceStatus} className="block h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            <DropdownMenuLabel>目前狀態</DropdownMenuLabel>
            {Object.entries(PRESENCE_LABELS).map(([value, label]) => (
              <DropdownMenuItem
                key={value}
                onClick={() => changePresence(value)}
                className={value === presenceStatus ? 'bg-brand-subtle text-brand' : ''}
              >
                <PresenceDot status={value} className="h-2.5 w-2.5 shrink-0" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="min-w-0 flex-1 text-center md:text-left">
        <div className="mb-0.5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <h2 className="text-xl font-bold text-ink">{user.displayName}</h2>
          {user.isVerified && (
            <Badge>
              <CheckCircle2 size={11} /> 已驗證
            </Badge>
          )}
        </div>
        <p className="text-sm text-ink-3">{user.email}</p>
      </div>
    </div>
  )
}
