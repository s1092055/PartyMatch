import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MessageSquare, Search, Send, SquarePen } from 'lucide-react'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import ModalShell from '../../shared/components/ui/ModalShell'
import { getCurrentUser, isAuthenticated } from '../../shared/stores/authStore'
import LoginPromptModal from '../../shared/components/ui/LoginPromptModal'
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationRead,
} from '../../shared/api/messagesApi'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [canSend, setCanSend] = useState(false)
  const [inputKey, setInputKey] = useState(0)
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function onOpen() {
      if (!isAuthenticated()) { setShowLoginPrompt(true); return }
      setIsOpen(true)
    }
    window.addEventListener('pm:open-messages', onOpen)
    return () => window.removeEventListener('pm:open-messages', onOpen)
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [selectedId, isOpen])

  function handleClose() {
    setIsOpen(false)
    setSelectedId(null)
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (showLoginPrompt) return <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
  if (!isOpen) return null

  const user = getCurrentUser()
  const selected = conversations.find(c => c.id === selectedId)
  const filteredConvs = searchQuery
    ? conversations.filter(c => c.name?.includes(searchQuery))
    : conversations

  return (
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
          <div className={`flex flex-1 flex-col ${selectedId ? 'flex' : 'hidden md:flex'}`}>
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
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-ink">{selected.name}</p>
                    <p className="text-xs text-ink-3">{selected.participants?.length ?? 2} 位成員</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-canvas">
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
                    const isMine = msg.senderId === user?.id
                    if (isMine) {
                      return (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[70%]">
                            <div className="rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-sm text-white">
                              {msg.text}
                            </div>
                            <p className="mt-1 text-right text-xs text-ink-4">{formatTime(msg.createdAt)}</p>
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
  )
}
