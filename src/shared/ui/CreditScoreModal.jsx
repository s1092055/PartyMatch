import { useState } from 'react'
import { ChevronLeft, Clock, ShieldCheck } from 'lucide-react'
import Modal from './primitives/Modal'
import { useAuthStore } from '../stores/useAuthStore'
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-md"
      height="min(80vh, 640px)"
      title={showHistory ? '信用分數紀錄' : '信用分數'}
      icon={showHistory ? (
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
      footer={!showHistory && (
        <div className="flex w-full flex-col gap-2">
          <button onClick={handleClose} className="btn btn-primary w-full">關閉</button>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-ink-4 transition-colors hover:bg-raised hover:text-ink"
          >
            <Clock size={13} /> 查看信用分數紀錄
          </button>
        </div>
      )}
    >
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
              <div className="divide-y divide-line-subtle rounded-xl border border-line">
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
    </Modal>
  )
}
