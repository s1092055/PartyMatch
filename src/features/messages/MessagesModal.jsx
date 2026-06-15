import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, LogOut, MessageSquare, MoreVertical, Search, Send, SquarePen, Trash2, Users, X } from 'lucide-react'
import ServiceLogo from '../../shared/ui/ServiceLogo'
import ModalShell from '../../shared/ui/ModalShell'
import { getCurrentUser, isAuthenticated } from '../../shared/stores/authStore'
import { getMembersByGroupId } from '../../shared/stores/memberStore'
import LoginPromptModal from '../../shared/ui/LoginPromptModal'
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationRead,
  getOrCreateDmConversation,
  leaveConversation,
  sendSystemMessage,
} from '../../shared/api/messagesApi'

function ConfirmDialog({ title, message, confirmLabel, danger = false, onConfirm, onCancel }) {
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-extrabold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors ${
              danger ? 'bg-danger hover:bg-red-700' : 'bg-brand hover:bg-brand-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const CONV_TABS = [
  { id: 'all',    label: '全部', filter: () => true },
  { id: 'group',  label: '群組', filter: c => c.type === 'group' },
  { id: 'dm',     label: '個人', filter: c => c.type === 'dm' },
  { id: 'system', label: '系統', filter: c => c.type === 'system' },
]

function formatTime(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

function ConversationAvatar({ conversation, size = 44 }) {
  if (conversation.serviceId) {
    return <ServiceLogo serviceId={conversation.serviceId} size={size} className="shrink-0 rounded-xl" />
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-sm font-black text-white"
      style={{ width: size, height: size, background: conversation.avatarColor ?? '#64748b' }}
    >
      {conversation.avatarInitial ?? '?'}
    </span>
  )
}

export default function MessagesModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [canSend, setCanSend] = useState(false)
  const [inputKey, setInputKey] = useState(0)
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const isComposingRef = useRef(false)
  const inputFocusedRef = useRef(false)
  const menuRef = useRef(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [prevSelectedId, setPrevSelectedId] = useState(selectedId)

  if (prevSelectedId !== selectedId) {
    setPrevSelectedId(selectedId)
    if (menuOpen) setMenuOpen(false)
    if (showMembers) setShowMembers(false)
  }

  useEffect(() => {
    function onOpen(e) {
      if (!isAuthenticated()) { setShowLoginPrompt(true); return }
      setIsOpen(true)
      const groupId = e?.detail?.groupId
      if (groupId) setSelectedId(`group_${groupId}`)
    }
    window.addEventListener('pm:open-messages', onOpen)
    return () => window.removeEventListener('pm:open-messages', onOpen)
  }, [])

  useEffect(() => {
    async function onOpenDm(e) {
      if (!isAuthenticated()) { setShowLoginPrompt(true); return }
      const user = getCurrentUser()
      if (!user) return
      const { hostId, hostName, hostAvatarInitial, hostAvatarColor } = e.detail ?? {}
      if (!hostId) return
      setIsOpen(true)
      const convId = await getOrCreateDmConversation(
        user.id,
        { name: user.name, avatarInitial: user.name?.[0] ?? '?', avatarColor: user.avatarColor ?? '#64748b' },
        hostId,
        { name: hostName, avatarInitial: hostAvatarInitial ?? hostName?.[0] ?? '?', avatarColor: hostAvatarColor ?? '#64748b' },
      )
      setSelectedId(convId)
    }
    window.addEventListener('pm:open-dm', onOpenDm)
    return () => window.removeEventListener('pm:open-dm', onOpenDm)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const user = getCurrentUser()
    if (!user) return
    const unsub = subscribeToConversations(user.id, setConversations)
    return () => { unsub(); setConversations([]) }
  }, [isOpen])

  useEffect(() => {
    if (!selectedId) return
    const unsub = subscribeToMessages(selectedId, setMessages)
    const user = getCurrentUser()
    if (user) markConversationRead(selectedId, user.id).catch(console.error)
    return () => { unsub(); setMessages([]) }
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedId || !inputFocusedRef.current || messages.length === 0) return
    const user = getCurrentUser()
    if (user) markConversationRead(selectedId, user.id).catch(console.error)
  }, [messages, selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [selectedId, isOpen])


  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  function handleLeaveGroup() {
    if (!selectedId || !user) return
    setMenuOpen(false)
    setConfirmDialog({
      title: '退出群組',
      message: '確定要退出此群組嗎？退出後將無法再看到群組訊息。',
      confirmLabel: '退出',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await sendSystemMessage(selectedId, `${user.name} 已退出群組`)
          await leaveConversation(selectedId, user.id)
        } catch (e) { console.error(e) }
        setSelectedId(null)
      },
    })
  }

  function handleDeleteConversation() {
    if (!selectedId || !user) return
    setMenuOpen(false)
    setConfirmDialog({
      title: '刪除對話',
      message: '確定要刪除此對話嗎？刪除後對話將從列表中移除。',
      confirmLabel: '刪除',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await leaveConversation(selectedId, user.id)
        } catch (e) { console.error(e) }
        setSelectedId(null)
      },
    })
  }

  function handleClose() {
    setIsOpen(false)
    setSelectedId(null)
    setActiveTab('all')
    setSearchQuery('')
    setCanSend(false)
    setSendError(false)
  }

  async function handleSend() {
    const text = inputRef.current?.value.trim() ?? ''
    if (!text || !selectedId || sending) return
    const user = getCurrentUser()
    if (!user) return

    setCanSend(false)
    setSendError(false)
    setSending(true)
    try {
      await sendMessage(selectedId, user.id, {
        senderName: user.name,
        avatarInitial: user.name?.[0] ?? '?',
        avatarColor: user.avatarColor ?? '#64748b',
        text,
        participants: selected?.participants ?? [],
      })
      setInputKey(k => k + 1)
    } catch {
      setCanSend(true)
      setSendError(true)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) { e.preventDefault(); handleSend() }
  }

  if (showLoginPrompt) return <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
  if (!isOpen) return null

  const user = getCurrentUser()

  const enrichedConvs = conversations.map(c => {
    if (c.type === 'dm') {
      const otherId = c.participants?.find(p => p !== user?.id)
      const meta = c.participantMeta?.[otherId] ?? {}
      return { ...c, name: meta.name ?? '私訊', avatarInitial: meta.avatarInitial ?? '?', avatarColor: meta.avatarColor ?? '#64748b' }
    }
    return c
  })

  const selected = enrichedConvs.find(c => c.id === selectedId)
  const tabFilter = CONV_TABS.find(t => t.id === activeTab)?.filter ?? (() => true)
  const filteredConvs = enrichedConvs
    .filter(tabFilter)
    .filter(c => !searchQuery || c.name?.includes(searchQuery))

  return (
    <>
    {confirmDialog && (
      <ConfirmDialog
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        danger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    )}
    <ModalShell
      onClose={handleClose}
      icon={<MessageSquare size={20} className="text-brand" />}
      title="訊息中心"
      height="min(88vh, 820px)"
    >
      {/* 內容區（左右欄） */}
      <div className="flex flex-1 overflow-hidden">

          {/* 對話列表 */}
          <div className={`flex w-full flex-col border-r border-line md:w-80 md:shrink-0 lg:w-96 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="border-b border-line px-3 py-2">
              <div className="flex items-center gap-2 rounded-xl bg-raised px-3 py-2">
                <Search size={14} className="shrink-0 text-ink-4" />
                <input
                  type="text"
                  placeholder="搜尋對話..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
                />
              </div>
            </div>

            <div className="flex border-b border-line px-3 py-2 gap-1">
              {CONV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand text-white'
                      : 'text-ink-3 hover:bg-raised hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-ink-4">
                  <SquarePen size={32} strokeWidth={1.5} />
                  <p className="text-sm">目前沒有對話</p>
                </div>
              )}
              {filteredConvs.map(conversation => {
                const unread = conversation.unreadCounts?.[user?.id] ?? 0
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised ${
                      conversation.id === selectedId ? 'bg-brand-subtle/40' : ''
                    }`}
                  >
                    <ConversationAvatar conversation={conversation} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-ink">{conversation.name}</span>
                        <span className="shrink-0 text-xs text-ink-4">{formatTime(conversation.lastMessageAt)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-ink-3">{conversation.lastMessage}</span>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1 text-xs font-black text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 聊天視窗 */}
          <div className={`relative flex flex-1 flex-col ${selectedId ? 'flex' : 'hidden md:flex'}`}>
            {selected ? (
              <>
                {/* 聊天室名稱 header */}
                <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
                  <button
                    onClick={() => setSelectedId(null)}
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
                      onClick={() => setMenuOpen(v => !v)}
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
                              onClick={() => { setShowMembers(v => !v); setMenuOpen(false) }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
                            >
                              <Users size={15} />
                              群組成員
                            </button>
                            <button
                              onClick={handleLeaveGroup}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
                            >
                              <LogOut size={15} />
                              退出群組
                            </button>
                            <div className="my-1 h-px bg-line-subtle" />
                          </>
                        )}
                        <button
                          onClick={handleDeleteConversation}
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
                          onClick={() => setShowMembers(false)}
                          className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3">
                        {(selected.participants ?? []).map(pid => {
                          const meta = selected.participantMeta?.[pid]
                          const member = memberMap[pid]
                          const name         = meta?.name         ?? member?.userName          ?? '成員'
                          const avatarInitial = meta?.avatarInitial ?? member?.userAvatarInitial ?? name[0] ?? '?'
                          const avatarColor  = meta?.avatarColor  ?? member?.userAvatarColor   ?? '#64748b'
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
                                {pid === user?.id && <p className="text-xs text-ink-4">（我）</p>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                <div className="flex-1 overflow-y-auto bg-canvas">
                  <div className="space-y-3 px-4 py-4">
                  {(() => {
                    const userId = user?.id
                    const otherIds = selected?.participants?.filter(p => p !== userId) ?? []
                    const isReadByOther =
                      otherIds.length > 0 &&
                      otherIds.every(id => (selected?.unreadCounts?.[id] ?? 0) === 0)

                    return messages.map(msg => {
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
                    })
                  })()}
                  <div ref={messagesEndRef} />
                  </div>
                </div>

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
                      onChange={e => { setCanSend(e.target.value.trim().length > 0); setSendError(false) }}
                      onFocus={() => {
                        inputFocusedRef.current = true
                        const user = getCurrentUser()
                        if (user && selectedId) markConversationRead(selectedId, user.id).catch(console.error)
                      }}
                      onBlur={() => { inputFocusedRef.current = false }}
                      onCompositionStart={() => { isComposingRef.current = true }}
                      onCompositionEnd={() => { isComposingRef.current = false }}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!canSend || sending}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white transition-all hover:bg-brand-hover disabled:opacity-40"
                      aria-label="傳送"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas text-ink-4">
                <SquarePen size={40} strokeWidth={1.5} />
                <p className="text-sm">選擇一個對話開始聊天</p>
              </div>
            )}
          </div>

      </div>{/* end flex-1 overflow-hidden */}
    </ModalShell>
    </>
  )
}
