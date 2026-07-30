import { useState } from 'react'
import Modal from '../../../shared/ui/primitives/Modal'
import { Avatar } from '../../../components/ui/avatar'
import StarRating from '../../../shared/ui/primitives/StarRating'
import { toast } from '../../../shared/utils/toast'

export default function ReviewHostModal({ group, onSubmit, onClose }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (rating === 0) return
    setSubmitting(true)
    try {
      await onSubmit({ rating, comment: comment.trim() || undefined })
      toast('感謝你的評價！', 'success')
      onClose()
    } catch (err) {
      toast(err?.message ?? '送出失敗，請稍後再試', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="給團主一個評價"
      maxWidth="max-w-sm"
      sub
      hideBack
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost flex-1">先跳過</button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="btn btn-primary flex-1"
          >
            {submitting ? '送出中…' : '送出評價'}
          </button>
        </>
      }
    >
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{group.hostName}</p>
            <p className="text-xs text-ink-3">{group.serviceName} · {group.planName}</p>
          </div>
        </div>

        <div className="py-2">
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="想跟其他人分享這次共享的體驗嗎？（選填）"
          rows={3}
          maxLength={500}
          className="field w-full resize-none text-sm focus:border-line focus:shadow-none"
        />
      </div>
    </Modal>
  )
}
