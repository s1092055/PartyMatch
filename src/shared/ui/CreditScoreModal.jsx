import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, Clock, ShieldCheck, X } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import CreditScoreBadge from './CreditScoreBadge'
import EmptyState from './primitives/EmptyState'
import { useScrollLock } from '../utils/hooks'

const RULES = [
  { label: '付款被團主確認', delta: '+2' },
  { label: '團主成功啟用群組', delta: '+5' },
  { label: '被移除出群組', delta: '-10' },
]

export default function CreditScoreModal({ isOpen, onClose }) {
  const creditScore = useAuthStore(s => s.user?.creditScore)
  const [showHistory, setShowHistory] = useState(false)

  useScrollLock(!!isOpen)

  function handleClose() { setShowHistory(false); onClose() }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/50 animate-backdrop-in" onClick={handleClose} />

      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-modal-in"
           style={{ height: 'min(92vh, 560px)' }}>

        {/* Slide track — 200% wide, two equal panels */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ width: '200%', transform: showHistory ? 'translateX(-50%)' : 'translateX(0)' }}
        >

          {/* ── Panel 1: 信用分數 ── */}
          <div className="flex w-1/2 min-w-0 flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} strokeWidth={1.5} className="text-ink-3" />
                <h2 className="text-base font-extrabold text-ink">信用分數</h2>
              </div>
              <button onClick={handleClose} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-col gap-5">
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
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-line px-5 py-4 flex flex-col gap-2">
              <button onClick={handleClose} className="btn btn-primary w-full">關閉</button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-ink-4 transition-colors hover:bg-raised hover:text-ink"
              >
                <Clock size={13} />
                查看信用分數紀錄
              </button>
            </div>
          </div>

          {/* ── Panel 2: 信用分數紀錄 ── */}
          <div className="flex w-1/2 min-w-0 flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-4">
              <button
                onClick={() => setShowHistory(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <ShieldCheck size={15} strokeWidth={1.5} className="text-ink-3" />
              <span className="flex-1 font-extrabold text-ink">信用分數紀錄</span>
            </div>

            {/* Body */}
            <EmptyState
              icon={Clock}
              title="尚無信用分數異動紀錄"
              description="加分與扣分紀錄將顯示在這裡"
              className="flex-1 justify-center"
            />
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
