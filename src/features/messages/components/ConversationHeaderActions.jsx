import { useNavigate } from 'react-router-dom'
import { Info, Users } from 'lucide-react'
import { useAuthStore } from '../../../shared/stores/useAuthStore'

// 直接放兩顆按鈕在聊天室 header 右邊，不用三個點點開選單——只有兩個選項，
// 點兩下（開選單、選項目）比直接點一下多一道手續，沒有必要
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
    // ManageGroupsPage 的跨頁面 effect 只在掛載當下讀 location.state，如果使用者本來就已經停在
    // /manage-groups（訊息是全域掛載的浮層，隨時可能在任何頁面被打開），上面的 navigate
    // 不會觸發重新掛載；要靠這個事件走「同頁面」那條路徑才能真的把 modal 打開
    // （SubscriptionsPage 的等效 effect 是用 location.key 當 deps，navigate 到同頁也會重新觸發，不需要事件）
    if (isHost) {
      window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: selected.groupId } }))
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleViewGroup}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:scale-100 active:opacity-70"
        aria-label="查看群組"
      >
        <Info size={18} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => onMembersToggle()}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:scale-100 active:opacity-70"
        aria-label="群組成員"
      >
        <Users size={18} strokeWidth={1.5} />
      </button>
    </div>
  )
}
