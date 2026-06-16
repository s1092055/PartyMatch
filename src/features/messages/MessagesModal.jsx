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
  sendSystemMessage,
} from '../../shared/api/messagesApi'
import ConfirmDialog from './components/ConfirmDialog'
import ConversationList, { CONV_TABS } from './components/ConversationList'
import ChatWindow from './components/ChatWindow'

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
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const isComposingRef = useRef(false)
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  function handleRequestLeaveGroup() {
    const user = getCurrentUser()
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
              inputKey={inputKey}
              menuRef={menuRef}
              menuOpen={menuOpen}
              showMembers={showMembers}
              isComposingRef={isComposingRef}
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
