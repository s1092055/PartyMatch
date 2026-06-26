import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import ConversationAvatar from './components/ConversationAvatar'
import ConversationMenu from './components/ConversationMenu'
import Modal from '../../shared/ui/Modal'
import LoginPromptModal from '../../shared/ui/LoginPromptModal'
import { getCurrentUser, isAuthenticated } from '../../shared/stores/authStore'
import { getConversations } from '../../shared/stores/conversationStore'
import {
  subscribeToMessages,
  sendMessage,
  markConversationRead,
  getOrCreateDmConversation,
  leaveConversation,
} from '../../shared/api/messagesApi'
import ConfirmDialog from '../../shared/ui/ConfirmDialog'
import ConversationList, { CONV_TABS } from './components/ConversationList'
import ChatWindow from './components/ChatWindow'

// Safari/Firefox 在輸入法選字確認時，compositionend 會在 Enter 的 keydown 之前（或極短時間內）觸發，
// 導致 isComposingRef 已被設回 false——額外用時間窗與 e.isComposing/keyCode 229 雙重判斷，
// 避免選字確認的 Enter 被誤判成送出訊息（Chrome 較少出現此問題，但保留判斷不影響其行為）。
function isImeConfirmEnter(e, isComposingRef, lastCompositionEndRef) {
  if (isComposingRef.current || e.nativeEvent?.isComposing || e.keyCode === 229) return true
  return Date.now() - lastCompositionEndRef.current < 50
}

export default function MessagesModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [canSend, setCanSend] = useState(false)
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  const inputRef = useRef(null)
  const isComposingRef = useRef(false)
  const lastCompositionEndRef = useRef(0)
  const inputFocusedRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowMembers(false)
  }, [selectedId])

  useEffect(() => {
    function onOpen(e) {
      if (!isAuthenticated()) { setShowLoginPrompt(true); return }
      setIsOpen(true)
      const groupId = e?.detail?.groupId
      if (groupId) setSelectedId(`group_${groupId}`)
    }
    function onClose() { setIsOpen(false) }
    window.addEventListener('pm:open-messages', onOpen)
    window.addEventListener('pm:close-messages', onClose)
    return () => {
      window.removeEventListener('pm:open-messages', onOpen)
      window.removeEventListener('pm:close-messages', onClose)
    }
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
    function onConvsChanged() { setConversations(getConversations()) }
    onConvsChanged()
    window.addEventListener('pm:convs-changed', onConvsChanged)
    return () => {
      window.removeEventListener('pm:convs-changed', onConvsChanged)
      setConversations([])
    }
  }, [isOpen])

  useEffect(() => {
    if (!selectedId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingMessages(true)
    const unsub = subscribeToMessages(
      selectedId,
      msgs => { setMessages(msgs); setLoadingMessages(false) },
      () => setLoadingMessages(false),
    )
    const user = getCurrentUser()
    if (user) {
      const conv = getConversations().find(c => c.id === selectedId)
      if ((conv?.unreadCounts?.[user.id] ?? 0) > 0) {
        markConversationRead(selectedId, user.id).catch(console.error)
      }
    }
    return () => { unsub(); setMessages([]); setLoadingMessages(false) }
  }, [selectedId])

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
    if (!text || !selectedId) return
    const user = getCurrentUser()
    if (!user) return
    if (!selected) return

    setCanSend(false)
    setSendError(false)
    if (inputRef.current) inputRef.current.value = ''
    requestAnimationFrame(() => inputRef.current?.focus())
    setSending(true)
    try {
      await sendMessage(selectedId, user.id, {
        senderName: user.name,
        avatarInitial: user.name?.[0] ?? '?',
        avatarColor: user.avatarColor ?? '#64748b',
        text,
        participants: selected?.participants ?? [],
      })
    } catch (error) {
      console.error('[MessagesModal] send failed:', error)
      if (inputRef.current) inputRef.current.value = text
      setCanSend(true)
      setSendError(true)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter' || e.shiftKey) return
    if (isImeConfirmEnter(e, isComposingRef, lastCompositionEndRef)) return
    e.preventDefault()
    handleSend()
  }

  function handleRequestDeleteConversation() {
    const user = getCurrentUser()
    if (!selectedId || !user) return
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
      <Modal
        onClose={handleClose}
        icon={isMobile && selectedId && selected
          ? <>
              <button
                onClick={() => setSelectedId(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                aria-label="返回"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="shrink-0">
                <ConversationAvatar conversation={selected} size={28} />
              </div>
            </>
          : <MessageSquare size={20} className="text-brand" />
        }
        title={isMobile && selectedId && selected ? selected.name : '訊息'}
        headerEnd={isMobile && selectedId && selected
          ? <ConversationMenu
              key={selectedId}
              selected={selected}
              onMembersToggle={() => setShowMembers(v => !v)}
              onDeleteConversation={handleRequestDeleteConversation}
            />
          : null
        }
        hideClose={isMobile && !!(selectedId && selected)}
        height="min(88vh, 820px)"
      >
        {/* 手機：200% slide 軌道；桌機：兩欄並排 */}
        <div className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* track 用 absolute top/bottom 取得確定高度，不依賴 flex-1 層層傳遞 */}
          <div
            className="absolute top-0 left-0 bottom-0 flex transition-transform duration-300 ease-in-out"
            style={{
              width: isMobile ? '200%' : '100%',
              transform: isMobile && selectedId ? 'translateX(-50%)' : 'translateX(0)',
            }}
          >
            {/* 左欄：對話列表 */}
            <div
              className="flex flex-col overflow-hidden"
              style={isMobile
                ? { width: '50%', flexShrink: 0 }
                : { width: '288px', flexShrink: 0, borderRight: '1px solid var(--color-line)' }
              }
            >
              <ConversationList
                filteredConvs={filteredConvs}
                activeTab={activeTab}
                selectedId={selectedId}
                user={user}
                searchQuery={searchQuery}
                onSelectConversation={setSelectedId}
                onTabChange={setActiveTab}
                onSearchChange={setSearchQuery}
              />
            </div>
            {/* 右欄：聊天視窗 */}
            <div
              className="relative flex flex-col overflow-hidden"
              style={isMobile
                ? { width: '50%', flexShrink: 0 }
                : { flex: '1 1 0%' }
              }
            >
              <ChatWindow
                selected={selected}
                selectedId={selectedId}
                messages={messages}
                loadingMessages={loadingMessages}
                user={user}
                sending={sending}
                sendError={sendError}
                canSend={canSend}
                inputRef={inputRef}
                showMembers={showMembers}
                isComposingRef={isComposingRef}
                lastCompositionEndRef={lastCompositionEndRef}
                inputFocusedRef={inputFocusedRef}
                onMembersToggle={setShowMembers}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                onInputChange={v => { setCanSend(v.trim().length > 0); setSendError(false) }}
                onRequestDeleteConversation={handleRequestDeleteConversation}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
