import { CalendarClock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input, Textarea } from '../../../components/ui/input'
import { toISODate } from '../../../common/utils/date'

const MAX_ADJUST_DAYS = 7

function getAllowedRange(currentDate) {
  const min = new Date(currentDate)
  min.setDate(min.getDate() + 1)
  const max = new Date(currentDate)
  max.setDate(max.getDate() + MAX_ADJUST_DAYS)
  return { min: toISODate(min), max: toISODate(max) }
}

export default function AdjustBillingDateModal({
  open, currentDate, newDate, setNewDate, note, setNote, saving, onClose, onSubmit,
}) {
  const { min, max } = currentDate ? getAllowedRange(currentDate) : {}

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-sm" instant>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <CalendarClock strokeWidth={1.5} size={18} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">調整下次扣款日</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>調整下次扣款日</DialogDescription>
        <DialogBody>
          <div className="space-y-4 p-5">
            <p className="text-sm text-ink-3">
              目前扣款日：{toISODate(currentDate, '—')}。只能往後延，最多延後 {MAX_ADJUST_DAYS} 天，每期僅能調整一次，全體成員會立即收到通知。
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-2">新的扣款日</label>
              <Input type="date" min={min} max={max} value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-2">調整原因</label>
              <Textarea
                rows={3}
                placeholder="例如：等待成員回覆帳號問題，延後幾天再開始收費..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            onClick={onSubmit}
            loading={saving}
            disabled={!newDate || !note.trim()}
            className="flex-1"
          >
            確認調整
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
