import { useNavigate } from 'react-router-dom'
import { Info, Users } from 'lucide-react'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { Button } from '../../../components/ui/button'

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
      <Button
        onClick={handleViewGroup}
        variant="ghost"
        size="icon"
        className="text-ink-3 hover:text-ink active:opacity-70"
        aria-label="查看群組"
      >
        <Info size={18} strokeWidth={1.5} />
      </Button>
      <Button
        onClick={() => onMembersToggle()}
        variant="ghost"
        size="icon"
        className="text-ink-3 hover:text-ink active:opacity-70"
        aria-label="群組成員"
      >
        <Users size={18} strokeWidth={1.5} />
      </Button>
    </div>
  )
}
