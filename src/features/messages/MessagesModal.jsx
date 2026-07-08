import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import ConversationAvatar from './components/ConversationAvatar'
import ConversationMenu from './components/ConversationMenu'
import Modal from '../../shared/ui/Modal'
import LoginPromptModal from '../../shared/ui/LoginPromptModal'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { useConversationStore } from '../../shared/stores/useConversationStore'
import { useNotificationStore } from '../../shared/stores/useNotificationStore'

const getCurrentUser = () => useAuthStore.getState().user
const isAuthenticated = () => useAuthStore.getState().loggedIn
import {
  fetchConversations,
  subscribeToMessages,
  sendMessage,
  markConversationRead,
  getOrCreateDmConversation,
} from '../../shared/api/messagesApi'
import { normalizeConversation, normalizeMessage } from '../../shared/utils/modelNormalizers'
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
  const conversations = useConversationStore(s => s.conversations)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  const inputRef = useRef(null)
  const isComposingRef = useRef(false)
  const lastCompositionEndRef = useRef(0)

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
    async function onOpen(e) {
      if (!isAuthenticated()) { setShowLoginPrompt(true); return }
      setIsOpen(true)
      const groupId = e?.detail?.groupId
      if (!groupId) return
      let conv = useConversationStore.getState().getByGroupId(groupId)
      if (!conv) {
        // 對話尚未進 store（成員端剛收到通知），主動 fetch 一次再查
        try {
          const convs = await fetchConversations()
          const fetched = convs.map(normalizeConversation)
          const fetchedIds = new Set(fetched.map(c => c.id))
          useConversationStore.setState(s => ({
            conversations: [
              ...fetched,
              ...s.conversations.filter(c => !fetchedIds.has(c.id)),
            ],
          }))
          conv = useConversationStore.getState().getByGroupId(groupId)
        } catch { /* ignore */ }
      }
      if (conv) setSelectedId(conv.id)
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
      const { hostId } = e.detail ?? {}
      if (!hostId) return
      setIsOpen(true)
      try {
        const conv = await getOrCreateDmConversation(hostId)
        useConversationStore.getState().addConversationOptimistic(normalizeConversation(conv))
        useConversationStore.getState().refresh(user.id)
        setSelectedId(conv.id)
      } catch (err) {
        console.error('[MessagesModal] DM 建立失敗:', err)
      }
    }
    window.addEventListener('pm:open-dm', onOpenDm)
    return () => window.removeEventListener('pm:open-dm', onOpenDm)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const unsub = subscribeToMessages(
      selectedId,
      msgs => setMessages(msgs),
      () => {},
    )
    const user = getCurrentUser()
    if (user) {
      const conv = useConversationStore.getState().getById(selectedId)
      if ((conv?.unreadCounts?.[user.id] ?? 0) > 0) {
        markConversationRead(selectedId).catch(console.error)
        useConversationStore.setState(s => ({
          conversations: s.conversations.map(c =>
            c.id === selectedId
              ? { ...c, unreadCounts: { ...c.unreadCounts, [user.id]: 0 } }
              : c
          ),
        }))
      }
      if (conv?.type === 'group' && conv.groupId) {
        const notifStore = useNotificationStore.getState()
        notifStore.getByUserId(user.id)
          .filter(n => n.meta?.groupId === conv.groupId && !n.isRead)
          .forEach(n => notifStore.markRead(n.id))
      }
    }
    return () => { unsub(); setMessages([]) }
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

    const tempId = `temp-${crypto.randomUUID()}`
    const optimisticMsg = normalizeMessage({
      id:          tempId,
      senderId:    user.id,
      sender:      { id: user.id, name: user.name, avatarInitial: user.name?.[0] ?? '?', avatarColor: user.avatarColor ?? '#64748b' },
      content:     text,
      type:        'text',
      createdAt:   new Date().toISOString(),
    })
    setMessages(prev => [...prev, optimisticMsg])

    setSending(true)
    try {
      const saved = await sendMessage(selectedId, user.id, {
        senderName: user.name,
        avatarInitial: user.name?.[0] ?? '?',
        avatarColor: user.avatarColor ?? '#64748b',
        text,
        participants: selected?.participants ?? [],
      })
      const msg = normalizeMessage(saved)
      setMessages(prev => prev.some(m => m.id === msg.id)
        ? prev.filter(m => m.id !== tempId)
        : prev.map(m => m.id === tempId ? msg : m)
      )
    } catch (error) {
      console.error('[MessagesModal] send failed:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
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
                user={user}
                sending={sending}
                sendError={sendError}
                canSend={canSend}
                inputRef={inputRef}
                showMembers={showMembers}
                isComposingRef={isComposingRef}
                lastCompositionEndRef={lastCompositionEndRef}
                onMembersToggle={setShowMembers}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                onInputChange={v => { setCanSend(v.trim().length > 0); setSendError(false) }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
