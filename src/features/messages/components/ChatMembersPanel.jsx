import { X } from 'lucide-react'
import { userProfileCache } from '../hooks/useParticipantNames'

export default function ChatMembersPanel({ open, selected, memberMap, userId, getParticipantName, onClose }) {
  return (
    <div
      className={`absolute bottom-0 right-0 top-0 z-10 flex w-60 flex-col border-l border-line bg-white shadow-lg transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      }`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <span className="text-sm font-extrabold text-ink">群組成員</span>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {(selected.participants ?? []).map(pid => {
          const meta = selected.participantMeta?.[pid]
          const member = memberMap[pid]
          const cached = userProfileCache.get(pid)
          const name          = getParticipantName(pid)
          const avatarInitial = meta?.avatarInitial ?? member?.userAvatarInitial ?? cached?.avatarInitial ?? name[0] ?? '?'
          const avatarColor   = meta?.avatarColor   ?? member?.userAvatarColor   ?? cached?.avatarColor   ?? '#64748b'
          return (
            <div key={pid} className="flex items-center gap-3 rounded-xl px-2 py-2">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-white"
                style={{ background: avatarColor }}
              >
                {avatarInitial}
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
  )
}
