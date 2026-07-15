import { ChevronDown, Send, SquarePen } from 'lucide-react'
import ConversationAvatar from './ConversationAvatar'
import ConversationMenu from './ConversationMenu'
import ChatMembersPanel from './ChatMembersPanel'
import MessageBubble from './MessageBubble'
import { useMemberStore } from '../../../shared/stores/useMemberStore'
import { useGroupStore } from '../../../shared/stores/useGroupStore'
import { useAuthStore } from '../../../shared/stores/useAuthStore'
import { markConversationRead } from '../../../shared/api/messagesApi'
import { useConversationStore } from '../../../shared/stores/useConversationStore'
import { useParticipantNames } from '../hooks/useParticipantNames'
import { useMessageScroll } from '../hooks/useMessageScroll'
import { isSystemConversation } from '../utils'

const getCurrentUser = () => useAuthStore.getState().user

export default function ChatWindow({
  selected, selectedId, messages, user,
  sending, sendError, canSend,
  inputRef,
  showMembers,
  isComposingRef, lastCompositionEndRef,
  onMembersToggle, onSend, onKeyDown, onInputChange,
}) {
  // 訂閱 store 切片，群組/成員更新時自動重新渲染
  const allGroups = useGroupStore(s => s.groups)
  const allMembers = useMemberStore(s => s.members)

  const userId = user?.id
  const otherIds = selected?.participants?.filter(p => p !== userId) ?? []
  const conversationGroupId = selected?.type === 'group'
    ? selected.groupId ?? (selectedId?.startsWith('group_') ? selectedId.slice('group_'.length) : null)
    : null
  const group = conversationGroupId ? (allGroups.find(g => g.id === conversationGroupId) ?? null) : null
  const groupMembers = conversationGroupId ? allMembers.filter(m => m.groupId === conversationGroupId) : []
  const memberMap = Object.fromEntries(groupMembers.map(m => [m.userId, m]))
  const metaHostId = group?.hostName
    ? selected?.participants?.find(pid => selected.participantMeta?.[pid]?.name === group.hostName)
    : null
  const nonMemberHostId = groupMembers.length > 0
    ? selected?.participants?.find(pid => !memberMap[pid])
    : null
  const firstParticipantHostId = selected?.type === 'group' ? selected.participants?.[0] : null
  const hostId = selected?.hostId ?? group?.hostId ?? metaHostId ?? nonMemberHostId ?? firstParticipantHostId

  const { getParticipantName, getMessageSenderName, getReadReceiptNames } = useParticipantNames({
    selected, selectedId, memberMap, hostId, group, userId, otherIds,
  })

  const { scrollContainerRef, showScrollToBottom, allMessages, loadingOlder, handleMessagesScroll, scrollToBottom } =
    useMessageScroll({ selectedId, messages })

  if (!selected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas text-ink-4">
        <SquarePen size={40} strokeWidth={1.5} />
        <p className="text-sm">選擇一個對話開始聊天</p>
      </div>
    )
  }

  return (
    <>

      {/* 桌機標題列（手機由 modal header 取代） */}
      <div className="hidden md:flex shrink-0 items-center gap-3 border-b border-line px-5 py-3">
        <ConversationAvatar conversation={selected} size={32} />
        <span className="flex-1 truncate font-extrabold text-ink">{selected.name}</span>
        <ConversationMenu
          key={selectedId}
          selected={selected}
          onMembersToggle={() => onMembersToggle(v => !v)}
        />
      </div>

      {/* 成員面板 */}
      {showMembers && selected.type === 'group' && (
        <ChatMembersPanel
          selected={selected}
          memberMap={memberMap}
          userId={userId}
          getParticipantName={getParticipantName}
          onClose={() => onMembersToggle(false)}
        />
      )}

      {/* 訊息區 */}
      <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* overscroll-contain：避免 Safari/WebKit 在送出訊息觸發 scrollIntoView smooth 時，
          捲動容器產生 rubber-band 回彈，短暫露出底部空白區域 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-canvas [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="space-y-3 px-4 py-4">
            {loadingOlder && (
              <div className="flex justify-center py-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink-3" />
              </div>
            )}
            {allMessages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                userId={userId}
                hostId={hostId}
                groupMembers={groupMembers}
                conversationGroupId={conversationGroupId}
                getMessageSenderName={getMessageSenderName}
                getReadReceiptNames={getReadReceiptNames}
              />
            ))}
          </div>
      </div>

      {showScrollToBottom && (
        <button
          onClick={() => scrollToBottom()}
          aria-label="回到最新訊息"
          className="absolute bottom-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink-3 shadow-popover transition-colors hover:bg-raised hover:text-ink"
        >
          <ChevronDown size={18} strokeWidth={1.5} />
        </button>
      )}
      </div>

      {/* 輸入區 */}
      <div className="shrink-0 border-t border-line bg-white px-6 py-4">
        {isSystemConversation(selected) ? (
          <p className="text-center text-xs text-ink-4">此為系統通知，無法回覆</p>
        ) : (
        <>
        {sendError && (
          <p className="mb-2 text-xs text-danger">傳送失敗，請稍後再試</p>
        )}
        <div className={`flex items-center gap-3 rounded-2xl border bg-raised px-4 py-2 ${sendError ? 'border-danger' : 'border-line'}`}>
          <input
            ref={inputRef}
            type="text"
            placeholder="輸入訊息..."
            onChange={e => onInputChange(e.target.value)}
            onFocus={() => {
              const user = getCurrentUser()
              if (user && selectedId && (selected?.unreadCounts?.[user.id] ?? 0) > 0) {
                markConversationRead(selectedId).catch(console.error)
                useConversationStore.setState(s => ({
                  conversations: s.conversations.map(c =>
                    c.id === selectedId
                      ? { ...c, unreadCounts: { ...c.unreadCounts, [user.id]: 0 } }
                      : c
                  ),
                }))
              }
            }}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => {
              isComposingRef.current = false
              lastCompositionEndRef.current = Date.now()
            }}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-busy={sending}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white transition-all hover:bg-brand-hover disabled:opacity-40"
            aria-label="傳送"
          >
            <Send size={14} />
          </button>
        </div>
        </>
        )}
      </div>

    </>
  )
}
