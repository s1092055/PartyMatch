import { MessageCircle, Users } from 'lucide-react'
import { Avatar } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'

export function buildMembersSubPanel({ group, groupId, members, activeUserId, setShowMembers, openDm }) {
  return {
    title: `群組名單（${members.filter(m => m.groupId === groupId && m.userId !== group.hostId).length + 1} 人）`,
    icon: <Users size={18} className="text-brand" />,
    content: (
      <div className="p-5 space-y-2">
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center gap-3">
            <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                <span className="shrink-0 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                  團主
                </span>
              </div>
              <p className="text-xs text-ink-3">{group.createdAt} 建立</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`私訊${group.hostName}`}
              onClick={() => { setShowMembers(false); openDm() }}
              className="text-ink-3 hover:text-brand"
            >
              <MessageCircle size={20} />
            </Button>
          </div>
        </div>
        {members.filter(m => m.groupId === groupId).map(m => (
          <div key={m.id} className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-3">
              <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {m.userName}
                  {m.userId === activeUserId && <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>}
                </p>
                <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  }
}
