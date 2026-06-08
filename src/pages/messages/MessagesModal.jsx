import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Search, Send, SquarePen, X } from 'lucide-react'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import { useScrollLock } from '../../shared/utils/hooks'
import { getCurrentUser } from '../../shared/stores/authStore'
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
  const [selectedId, setSelectedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [canSend, setCanSend] = useState(false)
  const [inputKey, setInputKey] = useState(0)
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useScrollLock(isOpen)

  useEffect(() => {
    function onOpen() { setIsOpen(true) }
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

  useEffect(() => {
    if (!isOpen) return
    function onEsc(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [isOpen])

  function handleClose() {
    setIsOpen(false)
    setSelectedId(null)
    setSearchQuery('')
    setCanSend(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleSend() {
    const text = inputRef.current?.value.trim() ?? ''
    if (!text || !selectedId || sending) return
    const user = getCurrentUser()
    if (!user) return

    setCanSend(false)
    setSending(true)
    try {
      await sendMessage(selectedId, user.id, {
        senderName: user.name,
        avatarInitial: user.name?.[0] ?? '?',
        avatarColor: user.avatarColor ?? '#64748b',
        text,
      })
      setInputKey(k => k + 1)
    } catch {
      setCanSend(true)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!isOpen) return null

  const user = getCurrentUser()
  const selected = conversations.find(c => c.id === selectedId)
  const filteredConvs = searchQuery
    ? conversations.filter(c => c.name?.includes(searchQuery))
    : conversations

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={handleClose} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-center justify-center p-4 md:p-8">
        <div className="pointer-events-auto flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ height: 'min(88vh, 820px)' }}>

          {/* 對話列表 */}
          <div className={`flex w-full flex-col border-r border-line md:w-80 md:shrink-0 lg:w-96 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <h2 className="text-base font-extrabold text-ink">訊息中心</h2>
              <button
                onClick={handleClose}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink md:hidden"
                aria-label="關閉"
              >
                <X size={18} />
              </button>
            </div>

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
                  <button
                    onClick={handleClose}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                    aria-label="關閉"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
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
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black text-white"
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

                <div className="shrink-0 border-t border-line bg-white px-4 py-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-2">
                    <input
                      key={inputKey}
                      ref={inputRef}
                      type="text"
                      placeholder="輸入訊息..."
                      onChange={e => setCanSend(e.target.value.trim().length > 0)}
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

        </div>
      </div>
    </>,
    document.body
  )
}
