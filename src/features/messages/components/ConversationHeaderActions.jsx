import { Info, Users } from 'lucide-react'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { Button } from '../../../components/ui/button'

export default function ConversationHeaderActions({ selected, onMembersToggle }) {
  if (selected?.type !== 'group') return null

  function handleViewGroup() {
    const userId = useAuthStore.getState().user?.id
    const isHost = selected.hostId === userId
    window.dispatchEvent(new CustomEvent('pm:close-messages'))
    window.dispatchEvent(new CustomEvent(isHost ? 'pm:open-host-group' : 'pm:open-group', { detail: { groupId: selected.groupId } }))
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
