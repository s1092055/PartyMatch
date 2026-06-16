import { ArrowLeft, LogOut, MoreVertical, Send, SquarePen, Trash2, Users, X } from 'lucide-react'
import ConversationAvatar from './ConversationAvatar'
import { getMembersByGroupId } from '../../../shared/stores/memberStore'
import { getCurrentUser } from '../../../shared/stores/authStore'
import { markConversationRead } from '../../../shared/api/messagesApi'
import { formatTime } from '../utils'

export default function ChatWindow({
  selected, selectedId, messages, loadingMessages, user,
  sending, sendError, canSend,
  inputRef, messagesEndRef, inputKey, menuRef,
  menuOpen, showMembers,
  isComposingRef, inputFocusedRef,
  onBack, onMenuToggle, onMembersToggle, onSend, onKeyDown, onInputChange,
  onRequestLeaveGroup, onRequestDeleteConversation,
}) {
  if (!selected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas text-ink-4">
        <SquarePen size={40} strokeWidth={1.5} />
        <p className="text-sm">選擇一個對話開始聊天</p>
      </div>
    )
  }

  const userId = user?.id
  const otherIds = selected?.participants?.filter(p => p !== userId) ?? []
  const isReadByOther =
    otherIds.length > 0 &&
    otherIds.every(id => (selected?.unreadCounts?.[id] ?? 0) === 0)

  return (
    <>
      {/* 聊天室名稱 header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
        <button
          onClick={onBack}
          className="mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink md:hidden"
          aria-label="返回"
        >
          <ArrowLeft size={18} />
        </button>
        <ConversationAvatar conversation={selected} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink">{selected.name}</p>
          <p className="text-xs text-ink-3">{selected.participants?.length ?? 2} 位成員</p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => onMenuToggle(v => !v)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
            aria-label="更多選項"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-white p-1 shadow-popover">
              {selected.type === 'group' && (
                <>
                  <button
                    onClick={() => { onMembersToggle(v => !v); onMenuToggle(false) }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
                  >
                    <Users size={15} />
                    群組成員
                  </button>
                  <button
                    onClick={onRequestLeaveGroup}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
                  >
                    <LogOut size={15} />
                    退出群組
                  </button>
                  <div className="my-1 h-px bg-line-subtle" />
                </>
              )}
              <button
                onClick={onRequestDeleteConversation}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
              >
                <Trash2 size={15} />
                刪除對話
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 成員面板 */}
      {showMembers && selected.type === 'group' && (() => {
        const groupMembers = selected.groupId ? getMembersByGroupId(selected.groupId) : []
        const memberMap = Object.fromEntries(groupMembers.map(m => [m.userId, m]))
        return (
          <div className="absolute bottom-0 right-0 top-0 z-10 flex w-60 flex-col border-l border-line bg-white shadow-lg">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="text-sm font-extrabold text-ink">群組成員</span>
              <button
                onClick={() => onMembersToggle(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {(selected.participants ?? []).map(pid => {
                const meta = selected.participantMeta?.[pid]
                const member = memberMap[pid]
                const name          = meta?.name          ?? member?.userName          ?? '成員'
                const avatarInitial = meta?.avatarInitial ?? member?.userAvatarInitial ?? name[0] ?? '?'
                const avatarColor   = meta?.avatarColor   ?? member?.userAvatarColor   ?? '#64748b'
                return (
                  <div key={pid} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-white"
                      style={{ background: avatarColor }}
                    >
                      {avatarInitial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{name}</p>
                      {pid === userId && <p className="text-xs text-ink-4">（我）</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* 訊息區 */}
      <div className="flex-1 overflow-y-auto bg-canvas">
        {loadingMessages ? (
          <div className="space-y-3 px-4 py-4">
            {[80, 60, 90, 50].map((w, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'items-end gap-2'}`}>
                {i % 2 !== 0 && <div className="h-8 w-8 shrink-0 rounded-full bg-line animate-pulse" />}
                <div className="h-9 animate-pulse rounded-2xl bg-line" style={{ width: `${w}%`, maxWidth: '70%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 px-4 py-4">
            {messages.map(msg => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="max-w-xs whitespace-pre-line rounded-2xl bg-raised px-4 py-2 text-center text-xs text-ink-3">
                      {msg.text}
                    </div>
                  </div>
                )
              }
              const isMine = msg.senderId === userId
              if (isMine) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[70%]">
                      <div className="rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-sm text-white">
                        {msg.text}
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <span className="text-xs text-ink-4">{formatTime(msg.createdAt)}</span>
                        {isReadByOther && <span className="text-xs text-ink-4">已讀</span>}
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <div key={msg.id} className="flex items-end gap-2">
                  <span
                    className="mb-6 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black text-white"
                    style={{ background: msg.avatarColor ?? '#64748b' }}
                  >
                    {msg.avatarInitial}
                  </span>
                  <div className="max-w-[70%]">
                    <p className="mb-1 text-xs font-bold text-ink-3">{msg.senderName}</p>
                    <div className="rounded-2xl rounded-tl-md bg-white px-4 py-2.5 text-sm text-ink shadow-sm">
                      {msg.text}
                    </div>
                    <p className="mt-1 text-xs text-ink-4">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 輸入區 */}
      <div className="shrink-0 border-t border-line bg-white px-6 py-4">
        {sendError && (
          <p className="mb-2 text-xs text-danger">傳送失敗，請稍後再試</p>
        )}
        <div className={`flex items-center gap-3 rounded-2xl border bg-raised px-4 py-2 ${sendError ? 'border-danger' : 'border-line'}`}>
          <input
            key={inputKey}
            ref={inputRef}
            type="text"
            placeholder="輸入訊息..."
            onChange={e => onInputChange(e.target.value)}
            onFocus={() => {
              inputFocusedRef.current = true
              const user = getCurrentUser()
              if (user && selectedId) markConversationRead(selectedId, user.id).catch(console.error)
            }}
            onBlur={() => { inputFocusedRef.current = false }}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => { isComposingRef.current = false }}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend || sending}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white transition-all hover:bg-brand-hover disabled:opacity-40"
            aria-label="傳送"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
