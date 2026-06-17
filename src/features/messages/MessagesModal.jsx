import { useEffect, useRef, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import ModalShell from '../../shared/ui/ModalShell'
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
import { scheduleLeaveGroup } from '../../shared/utils/leaveGroupFlow'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const isComposingRef = useRef(false)
  const lastCompositionEndRef = useRef(0)
  const inputFocusedRef = useRef(false)
  const menuRef = useRef(null)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMenuOpen(false)
    setShowMembers(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedId])

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

  // 訊息送達時／切換對話時是否自動捲到底部，改由 ChatWindow 自行判斷
  // （見 ChatWindow 的 scrollContainerRef 相關 effect）：
  // - 切換對話、訊息剛載入：強制捲到底部
  // - 已開著對話收到新訊息：只有使用者目前已在底部附近才自動捲動，避免把正在往上看舊訊息的人拉回底部

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

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

  function handleRequestLeaveGroup() {
    const user = getCurrentUser()
    if (!selectedId || !user) return
    setMenuOpen(false)
    const conv = getConversations().find(c => c.id === selectedId)
    const groupName = conv?.name ?? '此群組'
    const groupId = conv?.groupId ?? (selectedId.startsWith('group_') ? selectedId.slice('group_'.length) : null)
    setConfirmDialog({
      title: '退出群組',
      message: `確定要退出「${groupName}」嗎？退出後會立即釋出你的名額並離開聊天室，之後想再加入需要重新申請並等待團主審核；已產生的費用不會自動退還。`,
      confirmLabel: '退出',
      danger: true,
      onConfirm: () => {
        setConfirmDialog(null)
        setSelectedId(null)
        scheduleLeaveGroup({ conversationId: selectedId, groupId, user, groupName })
      },
    })
  }

  function handleRequestDeleteConversation() {
    const user = getCurrentUser()
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
        <div className="flex flex-1 overflow-hidden">
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

          <div className={`relative flex flex-1 flex-col ${selectedId ? 'flex' : 'hidden md:flex'}`}>
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
              messagesEndRef={messagesEndRef}
              menuRef={menuRef}
              menuOpen={menuOpen}
              showMembers={showMembers}
              isComposingRef={isComposingRef}
              lastCompositionEndRef={lastCompositionEndRef}
              inputFocusedRef={inputFocusedRef}
              onBack={() => setSelectedId(null)}
              onMenuToggle={setMenuOpen}
              onMembersToggle={setShowMembers}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
              onInputChange={v => { setCanSend(v.trim().length > 0); setSendError(false) }}
              onRequestLeaveGroup={handleRequestLeaveGroup}
              onRequestDeleteConversation={handleRequestDeleteConversation}
            />
          </div>
        </div>
      </ModalShell>
    </>
  )
}
