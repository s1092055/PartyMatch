import { useEffect, useRef, useState } from 'react'
import { fetchOlderMessages } from '../../../shared/api/messagesApi'

export function useMessageScroll({ selectedId, messages }) {
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
  }, [messages])

  return { scrollContainerRef, showScrollToBottom, allMessages, loadingOlder, handleMessagesScroll, scrollToBottom }
}
