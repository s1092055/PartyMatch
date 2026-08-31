import { useEffect, useState } from 'react'
import { Clock, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from './dialog'
import { Button } from './button'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { fetchCreditHistory } from '../../common/api/usersApi'
import CreditScoreBadge from './CreditScoreBadge'
import StarRating from './primitives/StarRating'
import EmptyState from './primitives/EmptyState'

const RULES = [
  { label: '收到 5★ 好評', delta: '+5' },
  { label: '收到 1-2★ 差評', delta: '-5' },
  { label: '被移除出群組', delta: '-10' },
]

export function CreditScoreModalBody({ onClose, hideFooter = false }) {
  const creditScore = useAuthStore(s => s.user?.creditScore)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchCreditHistory()
      .then(({ logs }) => { if (active) { setLogs(logs); setLogsLoading(false) } })
      .catch(() => { if (active) setLogsLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <>
      <div className="flex flex-col gap-5 px-5 py-5">
        <div className="flex justify-center py-2">
          <CreditScoreBadge score={creditScore} size="lg" />
        </div>
        <div>
          <p className="mb-2.5 text-xs font-medium text-ink-3">分數如何計算</p>
          <div className="divide-y divide-line-subtle rounded-lg border border-line">
            {RULES.map(rule => (
              <div key={rule.label} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink-2">{rule.label}</span>
                <span className={`font-bold ${rule.delta.startsWith('+') ? 'text-success-text' : 'text-danger-text'}`}>
                  {rule.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-ink-3">
            <Clock strokeWidth={1.5} size={13} /> 信用分數紀錄
          </p>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-ink-4">載入中…</div>
          ) : logs.length === 0 ? (
            <EmptyState icon={Clock} title="尚無信用分數異動紀錄" description="加分與扣分紀錄將顯示在這裡" />
          ) : (
            <div className="divide-y divide-line-subtle rounded-lg border border-line">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-2">{log.reason}</p>
                    <p className="text-xs text-ink-4">
                      {new Date(log.createdAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {log.relatedGroup && `．${log.relatedGroup.planName ?? log.relatedGroup.service?.name ?? ''}`}
                    </p>
                    {log.relatedReview && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <StarRating value={log.relatedReview.rating} readOnly size={10} />
                        {log.relatedReview.comment && (
                          <span className="truncate text-xs text-ink-4">「{log.relatedReview.comment}」</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`shrink-0 font-bold ${log.delta > 0 ? 'text-success-text' : 'text-danger-text'}`}>
                    {log.delta > 0 ? `+${log.delta}` : log.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {!hideFooter && (
        <DialogFooter>
          <Button onClick={onClose} className="w-full">關閉</Button>
        </DialogFooter>
      )}
    </>
  )
}

export default function CreditScoreModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent maxWidth="max-w-md" height="min(80dvh, 640px)">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} strokeWidth={1.5} className="text-brand" />
            <DialogTitle>信用分數</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>信用分數</DialogDescription>
        <DialogBody>
          {isOpen && <CreditScoreModalBody onClose={onClose} />}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
