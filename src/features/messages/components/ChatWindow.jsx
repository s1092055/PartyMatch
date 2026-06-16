import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, LogOut, MoreVertical, Send, SquarePen, Trash2, Users, X } from 'lucide-react'
import ConversationAvatar from './ConversationAvatar'
import { getMembersByGroupId } from '../../../shared/stores/memberStore'
import { getGroupById } from '../../../shared/stores/groupStore'
import { getCurrentUser } from '../../../shared/stores/authStore'
import { markConversationRead, addParticipantToConversation, fetchOlderMessages } from '../../../shared/api/messagesApi'
import { getUserProfile } from '../../../shared/api/usersApi'
import { formatTime } from '../utils'

// 名稱解析的最後備援：當對話的 participantMeta 缺漏（例如舊版資料損壞）且使用者也不在
// memberStore 裡時，直接查 users collection。模組層快取在對話間共用，避免重複查詢。
const userProfileCache = new Map()
const inFlightProfileFetches = new Set()

function ReadReceipt({ readers }) {
  if (readers.length === 0) return null
  const label = readers.length === 1 ? '已讀' : `${readers.length} 人已讀`
  const tooltip = `已讀：${readers.join('、')}`
  return (
    <span className="group relative inline-flex text-xs leading-normal text-ink-4" tabIndex={0} title={tooltip}>
      <span className="cursor-default">{label}</span>
      <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 w-max max-w-48 rounded-lg bg-ink px-2 py-1 text-xs leading-relaxed text-white opacity-0 shadow-popover transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {tooltip}
      </span>
    </span>
  )
}

const GENERIC_NAMES = new Set(['使用者', '成員', '新成員', '申請者', '匿名', '未知使用者'])

function usableName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  return trimmed && !GENERIC_NAMES.has(trimmed) ? trimmed : null
}

function toMillis(ts) {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (typeof ts.toDate === 'function') return ts.toDate().getTime()
  return new Date(ts).getTime()
}

export default function ChatWindow({
  selected, selectedId, messages, loadingMessages, user,
  sending, sendError, canSend,
  inputRef, messagesEndRef, menuRef,
  menuOpen, showMembers,
  isComposingRef, lastCompositionEndRef, inputFocusedRef,
  onBack, onMenuToggle, onMembersToggle, onSend, onKeyDown, onInputChange,
  onRequestLeaveGroup, onRequestDeleteConversation,
}) {
  // 用來在 userProfileCache（模組層、非 React state）有新結果時強制重新 render
  const [, setProfileResolveTick] = useState(0)

  const userId = user?.id
  const otherIds = selected?.participants?.filter(p => p !== userId) ?? []
  const conversationGroupId = selected?.type === 'group'
    ? selected.groupId ?? (selectedId?.startsWith('group_') ? selectedId.slice('group_'.length) : null)
    : null
  const group = conversationGroupId ? getGroupById(conversationGroupId) : null
  const groupMembers = conversationGroupId ? getMembersByGroupId(conversationGroupId) : []
  const memberMap = Object.fromEntries(groupMembers.map(m => [m.userId, m]))
  const metaHostId = group?.hostName
    ? selected?.participants?.find(pid => selected.participantMeta?.[pid]?.name === group.hostName)
    : null
  const nonMemberHostId = groupMembers.length > 0
    ? selected?.participants?.find(pid => !memberMap[pid])
    : null
  const firstParticipantHostId = selected?.type === 'group' ? selected.participants?.[0] : null
  const hostId = selected?.hostId ?? group?.hostId ?? metaHostId ?? nonMemberHostId ?? firstParticipantHostId

  function isHostParticipant(pid, name) {
    return pid === hostId || (!!group?.hostName && name === group.hostName)
  }

  function withHostLabel(pid, name) {
    if (!isHostParticipant(pid, name)) return name
    return name.includes('（團主）') ? name : `${name}（團主）`
  }

  function knownName(pid, fallbackName) {
    const meta = selected?.participantMeta?.[pid]
    const member = memberMap[pid]
    return (
      usableName(member?.userName) ??
      usableName(meta?.name) ??
      (pid === hostId ? usableName(group?.hostName) : null) ??
      usableName(fallbackName)
    )
  }

  function getParticipantName(pid, fallbackName = null) {
    const name = knownName(pid, fallbackName) ?? usableName(userProfileCache.get(pid)?.name) ?? '成員'
    return withHostLabel(pid, name)
  }

  function getMessageSenderName(msg) {
    return getParticipantName(msg.senderId, msg.senderName)
  }

  function getReadReceiptNames(msg) {
    if (msg.senderId !== userId) return []
    const msgTime = toMillis(msg.createdAt)
    // 用「對方讀到的時間點」(lastReadAt) 逐則比對，而不是看 unreadCounts 是否為 0——
    // unreadCounts 是整個對話的未讀計數，送出新訊息會讓它變回非 0，
    // 若拿它來判斷單則訊息的已讀狀態，會讓先前已讀過的舊訊息也被誤判成未讀。
    return otherIds
      .filter(pid => {
        const readAt = toMillis(selected?.lastReadAt?.[pid])
        return readAt > 0 && readAt >= msgTime
      })
      .map(pid => getParticipantName(pid))
  }

  // 名稱解析鏈（member 記錄／對話 participantMeta／團主名）都查不到時，
  // 最後查一次 users collection；查到後順手補寫回 participantMeta，修復損壞的舊資料。
  const unresolvedIds = (selected?.participants ?? [])
    .filter(pid => !userProfileCache.has(pid) && !knownName(pid))
  const unresolvedKey = unresolvedIds.join(',')

  useEffect(() => {
    if (!unresolvedKey) return
    unresolvedIds.forEach(pid => {
      if (inFlightProfileFetches.has(pid)) return
      inFlightProfileFetches.add(pid)
      getUserProfile(pid)
        .then(profile => {
          userProfileCache.set(pid, profile)
          if (profile?.name && selectedId) {
            addParticipantToConversation(selectedId, pid, profile).catch(console.error)
          }
        })
        .catch(err => { console.error('[ChatWindow] getUserProfile failed:', err); userProfileCache.set(pid, null) })
        .finally(() => {
          inFlightProfileFetches.delete(pid)
          setProfileResolveTick(t => t + 1)
        })
    })
    // unresolvedKey 已經是 unresolvedIds 的內容快照，刻意不放整個陣列/函式進 deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unresolvedKey, selectedId])

  // 「回到最新訊息」按鈕：使用者往上捲動看舊訊息時顯示，並避免捲動容器處於非底部時
  // 還被新訊息的 smooth scroll 硬拉回底部（那樣按鈕就失去意義了）
  const scrollContainerRef = useRef(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  // 切換對話時剛載入的第一批訊息，不能用「目前是否在底部附近」判斷——剛掛載的捲動容器
  // scrollTop 一律是 0，會被誤判成「使用者往上看舊訊息」。改用這個 ref 旗標強制捲到底一次
  // （ref 只能在 effect 裡寫，不能在 render 期間寫，所以用獨立的 effect 在切換對話時設回 true）。
  const pendingInitialScrollRef = useRef(true)
  // 分頁載入更早的歷史訊息：往上捲到頂部附近時，用一次性查詢補載入，merge 在即時訊息前面
  const [olderMessages, setOlderMessages] = useState([])
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const loadingOlderRef = useRef(false)
  const allMessages = [...olderMessages, ...messages]

  // 切換對話時重置狀態——用 render 期間比較前後 selectedId 的官方建議寫法，
  // 不在 effect 裡呼叫 setState 造成連鎖渲染
  const [prevSelectedId, setPrevSelectedId] = useState(selectedId)
  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId)
    setShowScrollToBottom(false)
    setOlderMessages([])
    setHasMoreOlder(true)
    setLoadingOlder(false)
  }

  useEffect(() => {
    pendingInitialScrollRef.current = true
    loadingOlderRef.current = false
  }, [selectedId])

  function isNearBottom(el, threshold = 200) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
  }

  function scrollToBottom(behavior = 'smooth') {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  async function loadOlderMessages() {
    const oldest = allMessages[0]
    if (loadingOlderRef.current || !hasMoreOlder || !oldest?.createdAt || !selectedId) return
    loadingOlderRef.current = true
    setLoadingOlder(true)
    const el = scrollContainerRef.current
    const prevScrollHeight = el?.scrollHeight ?? 0
    const prevScrollTop = el?.scrollTop ?? 0
    try {
      const { messages: older, hasMore } = await fetchOlderMessages(selectedId, oldest.createdAt)
      setOlderMessages(prev => [...older, ...prev])
      setHasMoreOlder(hasMore)
      // 在前面插入內容會把畫面往下推，補回同樣高度的差值讓視覺位置看起來沒有變動
      requestAnimationFrame(() => {
        if (el) el.scrollTop = prevScrollTop + (el.scrollHeight - prevScrollHeight)
      })
    } catch (err) {
      console.error('[ChatWindow] loadOlderMessages failed:', err)
    } finally {
      loadingOlderRef.current = false
      setLoadingOlder(false)
    }
  }

  function handleMessagesScroll(e) {
    const el = e.currentTarget
    setShowScrollToBottom(!isNearBottom(el))
    if (el.scrollTop < 150 && hasMoreOlder && !loadingOlderRef.current) {
      loadOlderMessages()
    }
  }

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || messages.length === 0) return
    if (pendingInitialScrollRef.current) {
      pendingInitialScrollRef.current = false
      scrollToBottom('instant')
      return
    }
    if (isNearBottom(el)) {
      scrollToBottom('smooth')
    } else {
      setShowScrollToBottom(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

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
      })()}

      {/* 訊息區 */}
      <div className="relative flex-1 overflow-hidden">
      {/* overscroll-contain：避免 Safari/WebKit 在送出訊息觸發 scrollIntoView smooth 時，
          捲動容器產生 rubber-band 回彈，短暫露出底部空白區域 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        className="h-full overflow-y-auto overscroll-contain bg-canvas"
      >
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
            {loadingOlder && (
              <div className="flex justify-center py-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink-3" />
              </div>
            )}
            {allMessages.map(msg => {
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
                const readReceiptNames = getReadReceiptNames(msg)
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[70%]">
                      {/* 自己發的訊息不需要再標示自己的名字 */}
                      {/* w-fit + ml-auto：避免 Safari 因已讀名單變長（2 人以上）讓 abs 定位 tooltip
                          撐大 position:relative 祖先的 intrinsic width，連帶把這個 block div
                          的 width:auto 撐寬，在文字後方留下大片空白；ml-auto 確保泡泡縮回文字寬度後
                          仍貼齊右側（跟下方時間/已讀那一列一致），不會整個往左移 */}
                      <div className="ml-auto w-fit rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-sm text-white">
                        {msg.text}
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <span className="text-xs leading-normal text-ink-4">{formatTime(msg.createdAt)}</span>
                        <ReadReceipt readers={readReceiptNames} />
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
                    <p className="mb-1 text-xs font-bold text-ink-3">{getMessageSenderName(msg)}</p>
                    <div className="w-fit rounded-2xl rounded-tl-md bg-white px-4 py-2.5 text-sm text-ink shadow-sm">
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

      {showScrollToBottom && (
        <button
          onClick={() => scrollToBottom()}
          aria-label="回到最新訊息"
          className="absolute bottom-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink-3 shadow-popover transition-colors hover:bg-raised hover:text-ink"
        >
          <ChevronDown size={18} />
        </button>
      )}
      </div>

      {/* 輸入區 */}
      <div className="shrink-0 border-t border-line bg-white px-6 py-4">
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
              inputFocusedRef.current = true
              const user = getCurrentUser()
              if (user && selectedId && (selected?.unreadCounts?.[user.id] ?? 0) > 0) {
                markConversationRead(selectedId, user.id).catch(console.error)
              }
            }}
            onBlur={() => { inputFocusedRef.current = false }}
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
      </div>
    </>
  )
}
