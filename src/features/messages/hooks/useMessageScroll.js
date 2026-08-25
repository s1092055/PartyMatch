import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchOlderMessages } from '../../../common/api/messagesApi'

export function useMessageScroll({ selectedId, messages }) {
  const scrollContainerRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const pendingInitialScrollRef = useRef(true);
  const [olderMessages, setOlderMessages] = useState([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const loadingOlderRef = useRef(false)
  const allMessages = useMemo(() => [...olderMessages, ...messages], [olderMessages, messages])

  const [prevSelectedId, setPrevSelectedId] = useState(selectedId);
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
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
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
      requestAnimationFrame(() => {
        if (el) el.scrollTop = prevScrollTop + (el.scrollHeight - prevScrollHeight)
      });
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
  }, [messages])

  return { scrollContainerRef, showScrollToBottom, allMessages, loadingOlder, handleMessagesScroll, scrollToBottom }
}
