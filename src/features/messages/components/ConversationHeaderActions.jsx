import { useNavigate } from 'react-router-dom'
import { Info, Users } from 'lucide-react'
import { useAuthStore } from '../../../common/stores/useAuthStore'

export default function ConversationHeaderActions({ selected, onMembersToggle }) {
  const navigate = useNavigate()

  if (selected?.type !== 'group') return null

  function handleViewGroup() {
    const userId = useAuthStore.getState().user?.id
    const isHost = selected.hostId === userId
    window.dispatchEvent(new CustomEvent('pm:close-messages'))
    navigate(isHost ? '/manage-groups' : '/my-subscriptions', {
      state: { openGroupId: selected.groupId },
    })
    if (isHost) {
      window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: selected.groupId } }))
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleViewGroup}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70"
        aria-label="查看群組"
      >
        <Info size={18} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => onMembersToggle()}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70"
        aria-label="群組成員"
      >
        <Users size={18} strokeWidth={1.5} />
      </button>
    </div>
  )
}
