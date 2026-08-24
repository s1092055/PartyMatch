import { useEffect, useRef, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { Avatar } from '../avatar'
import { Input } from '../input'
import { Button } from '../button'
import EvidenceLink from '../EvidenceLink'
import AttachmentPickerButton from '../AttachmentPickerButton'
import AttachmentPreviewChip from '../AttachmentPreviewChip'
import { PresenceDot } from '../../../common/layout/components/navShared'
import { fetchCredentialComments, createCredentialComment } from '../../../common/api/credentialCommentsApi'
import { uploadCredentialCommentAttachment } from '../../../common/api/storageApi'
import { startPolling } from '../../../common/utils/poller'
import { formatRelativeDate } from '../../../common/utils/date'
import { toast } from '../../../common/utils/toast'
import { useEvidenceUpload } from '../../../common/utils/hooks'

export default function CredentialCommentsSection({ groupId, hostId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)
  const attachment = useEvidenceUpload(uploadCredentialCommentAttachment)

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
    if ((!content && !attachment.url) || sending || attachment.uploading) return
    setSending(true)
    try {
      const comment = await createCredentialComment({ groupId, content, attachmentUrl: attachment.key })
      setComments(prev => [...prev, comment])
      setText('')
      attachment.reset()
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
                {c.author?.id === hostId && (
                  <span className="shrink-0 rounded-full bg-brand-subtle px-1.5 py-0.5 text-2xs font-semibold leading-none text-brand">團主</span>
                )}
                <p className="shrink-0 text-2xs text-ink-4">{formatRelativeDate(c.createdAt)}</p>
              </div>
              {c.content && <p className="whitespace-pre-wrap break-words text-xs text-ink-2">{c.content}</p>}
              {c.attachmentUrl && (
                <EvidenceLink
                  url={c.attachmentUrl}
                  className="mt-1 flex h-auto w-fit items-center gap-1 rounded-lg border border-line px-2 py-1 text-2xs font-medium text-brand hover:bg-brand-subtle"
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <AttachmentPreviewChip attachment={attachment} />
      <form onSubmit={handleSend} className="mt-2 flex items-center gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="輸入留言…"
          maxLength={500}
          className="flex-1 py-2"
        />
        <AttachmentPickerButton
          attachment={attachment}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-4 transition-colors hover:bg-raised hover:text-ink-2 disabled:opacity-40"
        />
        <Button type="submit" size="icon" disabled={(!text.trim() && !attachment.url) || sending || attachment.uploading} className="shrink-0 rounded-lg">
          <Send size={15} strokeWidth={1.5} />
        </Button>
      </form>
    </div>
  )
}
