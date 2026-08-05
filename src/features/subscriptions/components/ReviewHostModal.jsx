import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from '../../../components/ui/dialog'
import { Avatar } from '../../../components/ui/avatar'
import { PresenceDot } from '../../../common/layout/components/navShared'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/input'
import StarRating from '../../../components/ui/primitives/StarRating'
import { toast } from '../../../common/utils/toast'

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
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-sm">
        <DialogHeader>
          <DialogTitle className="truncate text-base">給團主一個評價</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>給團主一個評價</DialogDescription>
        <DialogBody>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <span className="relative inline-block shrink-0">
            <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
            <PresenceDot status={group.hostPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-3 w-3" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{group.hostName}</p>
            <p className="text-xs text-ink-3">{group.serviceName} · {group.planName}</p>
          </div>
        </div>

        <div className="py-2">
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>

        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="分享你的體驗（選填）"
          rows={3}
          maxLength={500}
          className="resize-none"
        />
      </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="flex-1">先跳過</Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex-1"
          >
            {submitting ? '送出中…' : '送出評價'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
