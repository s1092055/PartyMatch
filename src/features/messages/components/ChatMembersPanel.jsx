import { X } from 'lucide-react'
import { userProfileCache } from '../hooks/useParticipantNames'
import { Avatar } from '../../../components/ui/avatar'
import { PresenceDot } from '../../../common/layout/components/navShared'

export default function ChatMembersPanel({ open, selected, memberMap, userId, getParticipantName, onClose }) {
  return (
    <div
      className={`absolute bottom-0 right-0 top-0 z-10 flex w-60 flex-col border-l border-line bg-surface shadow-popover transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      }`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <span className="text-sm font-extrabold text-ink">群組成員</span>
        <button
          onClick={onClose}
          aria-label="關閉"
          className="grid h-11 w-11 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        >
          <X strokeWidth={1.5} size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {(selected.participants ?? []).map(pid => {
          const meta = selected.participantMeta?.[pid]
          const member = memberMap[pid]
          const cached = userProfileCache.get(pid)
          const avatarInitial = meta?.avatarInitial ?? member?.userAvatarInitial ?? cached?.avatarInitial ?? '';
          const avatarColor   = meta?.avatarColor   ?? member?.userAvatarColor   ?? cached?.avatarColor   ?? '#64718A'
          const presenceStatus = meta?.presenceStatus ?? member?.userPresenceStatus ?? cached?.presenceStatus ?? 'offline'
          return (
            <div key={pid} className="flex items-center gap-3 rounded-lg px-2 py-2">
              <span className="relative inline-block shrink-0">
                <Avatar initial={avatarInitial} color={avatarColor} size="sm" className="text-xs" />
                <PresenceDot status={presenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{getParticipantName(pid)}</p>
                {pid === userId && <p className="text-xs text-ink-4">（我）</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
