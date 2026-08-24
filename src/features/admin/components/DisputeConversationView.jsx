import { MessageSquare } from 'lucide-react'
import ReadonlyMessageList from '../../../components/ui/ReadonlyMessageList'

export default function DisputeConversationView({ credentialComments, conversationMessages, hostId }) {
  const items = [
    ...credentialComments.map(c => ({
      id: `comment-${c.id}`,
      authorId: c.author?.id,
      authorName: c.author?.name,
      avatarInitial: c.author?.avatarInitial,
      avatarColor: c.author?.avatarColor,
      presenceStatus: c.author?.presenceStatus,
      content: c.content,
      attachmentUrl: c.attachmentUrl,
      createdAt: c.createdAt,
    })),
    ...conversationMessages
      .filter(m => m.senderId)
      .map(m => ({
        id: `message-${m.id}`,
        authorId: m.sender?.id,
        authorName: m.sender?.name,
        avatarInitial: m.sender?.avatarInitial,
        avatarColor: m.sender?.avatarColor,
        presenceStatus: m.sender?.presenceStatus,
        content: m.content,
        attachmentUrl: m.attachmentUrl,
        createdAt: m.createdAt,
      })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-3">
        <MessageSquare size={14} strokeWidth={1.5} /> 雙方對話記錄
      </p>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-line-subtle p-3">
        <ReadonlyMessageList items={items} hostId={hostId} emptyText="尚無對話記錄" />
      </div>
    </div>
  )
}
