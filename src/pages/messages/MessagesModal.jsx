import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Phone, Search, Send, SquarePen, X } from 'lucide-react'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import { useScrollLock } from '../../shared/utils/hooks'
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../../shared/data/messages.mock'

function ConversationAvatar({ conv, size = 44 }) {
  if (conv.serviceId) {
    return <ServiceLogo serviceId={conv.serviceId} size={size} className="shrink-0 rounded-xl" />
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-sm font-black text-white"
      style={{ width: size, height: size, background: conv.avatarColor ?? '#64748b' }}
    >
      {conv.avatarInitial}
    </span>
  )
}

export default function MessagesModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  useScrollLock(isOpen)

  useEffect(() => {
    function onOpen() { setIsOpen(true) }
    window.addEventListener('pm:open-messages', onOpen)
    return () => window.removeEventListener('pm:open-messages', onOpen)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    function onEsc(e) { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [selectedId, isOpen])

  if (!isOpen) return null

  const selected = MOCK_CONVERSATIONS.find(c => c.id === selectedId)
  const messages = MOCK_MESSAGES[selectedId] ?? []
  const filteredConvs = searchQuery
    ? MOCK_CONVERSATIONS.filter(c => c.name.includes(searchQuery))
    : MOCK_CONVERSATIONS

  function handleSend() {
    if (!inputText.trim()) return
    setInputText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-[56] flex overflow-hidden rounded-2xl bg-white shadow-2xl md:inset-8 lg:inset-12">

        {/* Left: Conversation list */}
        <div className={`flex w-full flex-col border-r border-line md:w-80 md:shrink-0 lg:w-96 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
            <h2 className="text-base font-extrabold text-ink">訊息中心</h2>
            <div className="flex items-center gap-1">
              <button
                className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                aria-label="新增對話"
              >
                <SquarePen size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink md:hidden"
                aria-label="關閉"
              >
                <X size={18} />
              </button>
            </div>
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
            {filteredConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised ${
                  conv.id === selectedId ? 'bg-brand-subtle/40' : ''
                }`}
              >
                <ConversationAvatar conv={conv} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-ink">{conv.name}</span>
                    <span className="shrink-0 text-xs text-ink-4">{conv.lastMessageTime}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-ink-3">{conv.lastMessage}</span>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1 text-xs font-black text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Chat view */}
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
                <ConversationAvatar conv={selected} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{selected.name}</p>
                  <p className="text-xs text-ink-3">{selected.memberCount} 位成員</p>
                </div>
                <button
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                  aria-label="語音通話"
                >
                  <Phone size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
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
                  if (msg.isMine) {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[70%]">
                          <div className="rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-sm text-white">
                            {msg.text}
                          </div>
                          <p className="mt-1 text-right text-xs text-ink-4">{msg.time}</p>
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
                        <p className="mt-1 text-xs text-ink-4">{msg.time}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-line bg-white px-4 py-3">
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-2">
                  <input
                    type="text"
                    placeholder="輸入訊息..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
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
    </>,
    document.body
  )
}
