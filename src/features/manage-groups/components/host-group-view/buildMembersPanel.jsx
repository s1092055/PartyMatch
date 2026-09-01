import { MessageCircle, Star, UserX } from 'lucide-react'
import { AvatarWithPresence } from '../../../../components/ui/avatar'
import { Button } from '../../../../components/ui/button'

export function buildMembersPanel({ group, members, setActivePanel, onClose, setRemovingMember, onReviewMember, showReviewButton }) {
  return {
    content: (
      <div className="relative min-h-full p-5">
        <div className="space-y-2">
          <div className="rounded-lg border border-line p-3">
            <div className="flex items-center gap-3">
              <AvatarWithPresence initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" presenceStatus={group.hostPresenceStatus} dotClassName="h-2.5 w-2.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {group.hostName}
                  <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>
                </p>
                <p className="text-xs text-ink-3">{group.createdAt} 建立</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                團主
              </span>
            </div>
            {group.hostBio && <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink-3">{group.hostBio}</p>}
          </div>
          {members.map(m => {
            const removable = ['recruiting', 'full'].includes(group.status)
            return (
              <div key={m.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center gap-3">
                  <AvatarWithPresence initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" presenceStatus={m.userPresenceStatus} dotClassName="h-2.5 w-2.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {showReviewButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`評價${m.userName}`}
                        onClick={() => onReviewMember?.(m)}
                        className="text-ink-3 hover:text-warning"
                      >
                        <Star strokeWidth={1.5} size={20} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`私訊${m.userName}`}
                      onClick={() => {
                        setActivePanel(null)
                        onClose()
                        window.dispatchEvent(new CustomEvent('pm:open-dm', {
                          detail: { hostId: m.userId, hostName: m.userName, hostAvatarInitial: m.userAvatarInitial, hostAvatarColor: m.userAvatarColor },
                        }))
                      }}
                      className="text-ink-3 hover:text-brand"
                    >
                      <MessageCircle strokeWidth={1.5} size={20} />
                    </Button>
                    {removable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`移除${m.userName}`}
                        onClick={() => setRemovingMember(m)}
                        className="text-ink-3 hover:text-danger"
                      >
                        <UserX strokeWidth={1.5} size={20} />
                      </Button>
                    )}
                  </div>
                </div>
                {m.userBio && <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink-3">{m.userBio}</p>}
              </div>
            )
          })}
        </div>
      </div>
    ),
  }
}
