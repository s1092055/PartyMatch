import { MessageCircle, Shield, UserX } from 'lucide-react'
import Avatar from '../../../../../shared/ui/primitives/Avatar'

export function buildMembersPanel({ group, members, setActivePanel, onClose, setRemovingMember }) {
  return {
    content: (
      <div className="p-5 space-y-2">
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center gap-3">
            <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {group.hostName}
                <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>
              </p>
              <p className="text-xs text-ink-3">{group.createdAt} 建立</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
              <Shield size={11} /> 團主
            </span>
          </div>
        </div>
        {members.map(m => {
          const removable = ['recruiting', 'full'].includes(group.status)
          return (
            <div key={m.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{m.userName}</p>
                  <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setActivePanel(null)
                      onClose()
                      window.dispatchEvent(new CustomEvent('pm:open-dm', {
                        detail: { hostId: m.userId, hostName: m.userName, hostAvatarInitial: m.userAvatarInitial, hostAvatarColor: m.userAvatarColor },
                      }))
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
                  >
                    <MessageCircle size={20} />
                  </button>
                  {removable && (
                    <button
                      onClick={() => setRemovingMember(m)}
                      className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-danger"
                    >
                      <UserX size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    ),
  }
}
