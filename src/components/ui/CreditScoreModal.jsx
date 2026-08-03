import { useState } from 'react'
import { ChevronLeft, Clock, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from './dialog'
import { Button } from './button'
import { useAuthStore } from '../../common/stores/useAuthStore'
import CreditScoreBadge from './CreditScoreBadge'
import EmptyState from './primitives/EmptyState'

const RULES = [
  { label: '付款被團主確認', delta: '+2' },
  { label: '團主成功啟用群組', delta: '+5' },
  { label: '被移除出群組', delta: '-10' },
]

export default function CreditScoreModal({ isOpen, onClose }) {
  const creditScore = useAuthStore(s => s.user?.creditScore)
  const [showHistory, setShowHistory] = useState(false)

  function handleClose() { setShowHistory(false); onClose() }

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent maxWidth="max-w-md" height="min(80dvh, 640px)">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {showHistory ? (
              <button
                onClick={() => setShowHistory(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                aria-label="返回"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
            ) : (
              <ShieldCheck size={16} strokeWidth={1.5} className="text-brand" />
            )}
            <DialogTitle>{showHistory ? '信用分數紀錄' : '信用分數'}</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>信用分數</DialogDescription>
        <DialogBody>
          <div key={showHistory ? 'history' : 'main'} className="flex min-h-0 flex-1 flex-col animate-step-slide-up">
            {showHistory ? (
              <EmptyState icon={Clock} title="尚無信用分數異動紀錄" description="加分與扣分紀錄將顯示在這裡" className="flex-1 justify-center" />
            ) : (
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
                        <span className={`font-bold ${rule.delta.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                          {rule.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogBody>
        {!showHistory && (
          <DialogFooter className="flex-col gap-2">
            <Button onClick={handleClose} className="w-full">關閉</Button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-ink-4 transition-colors hover:bg-raised hover:text-ink"
            >
              <Clock size={13} /> 查看信用分數紀錄
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
