import { useEffect, useRef, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { Avatar } from '../avatar'
import { Input } from '../input'
import { Button } from '../button'
import { PresenceDot } from '../../../common/layout/components/navShared'
import { fetchCredentialComments, createCredentialComment } from '../../../common/api/credentialCommentsApi'
import { startPolling } from '../../../common/utils/poller'
import { formatRelativeDate } from '../../../common/utils/date'
import { toast } from '../../../common/utils/toast'

// 「帳號資訊」分頁底下的留言區（shared_credentials 服務限定），團主與該群組所有成員都看得到、
// 都能留言，用來針對帳密內容直接溝通（密碼錯誤、詢問 Profile 名稱等），跟群組聊天室分開，
// 訊息不會混在一起；用輪詢而非即時連線，跟 Conversations 同一套做法（見 CLAUDE.md）
export default function CredentialCommentsSection({ groupId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    const stop = startPolling(async (isActive) => {
      try {
        const data = await fetchCredentialComments(groupId)
        if (isActive()) { setComments(data); setLoading(false) }
      } catch {
        if (isActive()) setLoading(false)
      }
    }, 5000)
    return stop
  }, [groupId])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [comments.length])

  async function handleSend(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const comment = await createCredentialComment({ groupId, content })
      setComments(prev => [...prev, comment])
      setText('')
    } catch (err) {
      toast(err?.message ?? '留言失敗，請稍後再試', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-4 border-t border-line-subtle pt-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-2">
        <MessageSquare size={14} strokeWidth={1.5} /> 留言
      </p>
      <div ref={listRef} className="max-h-56 space-y-3 overflow-y-auto rounded-lg p-3">
        {loading ? (
          <p className="py-4 text-center text-xs text-ink-4">載入中…</p>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-4">還沒有留言，關於帳號資訊有問題可以在這裡詢問</p>
        ) : comments.map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <span className="relative inline-block shrink-0">
              <Avatar initial={c.author?.avatarInitial} color={c.author?.avatarColor} size="xs" className="text-2xs" />
              <PresenceDot status={c.author?.presenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2 w-2" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <p className="truncate text-xs font-semibold text-ink">{c.author?.name ?? '使用者'}</p>
                <p className="shrink-0 text-2xs text-ink-4">{formatRelativeDate(c.createdAt)}</p>
              </div>
              <p className="whitespace-pre-wrap break-words text-xs text-ink-2">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="mt-2 flex items-center gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="輸入留言…"
          maxLength={500}
          className="flex-1 py-2"
        />
        <Button type="submit" size="icon" disabled={!text.trim() || sending} className="shrink-0 rounded-lg">
          <Send size={15} strokeWidth={1.5} />
        </Button>
      </form>
    </div>
  )
}
