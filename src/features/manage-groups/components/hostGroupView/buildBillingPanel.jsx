import { Banknote, RefreshCw } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import EmptyState from '../../../../components/ui/primitives/EmptyState'
import BillingCycleSection from './BillingCycleSection'

export function buildBillingPanel({ members, transactions, transactionsLoading, showRenewal, onOpenRenewal, currentCycle, isCancelled }) {
  const cycleGroups = new Map()
  for (const tx of transactions) {
    const cycle = tx.cycle ?? 1
    if (!cycleGroups.has(cycle)) cycleGroups.set(cycle, [])
    cycleGroups.get(cycle).push(tx)
  }
  // 越新的期數排在越上面
  const cycles = [...cycleGroups.keys()].sort((a, b) => b - a)

  return {
    content: (
      <div className={`relative min-h-full p-5 ${showRenewal ? 'pb-16' : ''}`}>
        {transactionsLoading ? (
          <p className="py-8 text-center text-sm text-ink-3">載入中…</p>
        ) : members.length === 0 && cycles.length === 0 ? (
          <EmptyState icon={Banknote} title="目前尚無成員" />
        ) : cycles.length === 0 ? (
          <EmptyState icon={Banknote} title="目前尚無代管紀錄" />
        ) : (
          <div className="space-y-3">
            {cycles.map(cycle => (
              <BillingCycleSection
                key={cycle}
                cycle={cycle}
                isCurrentCycle={cycle === currentCycle}
                transactions={cycleGroups.get(cycle)}
                isCancelled={isCancelled}
                defaultOpen={cycle === cycles[0]}
              />
            ))}
          </div>
        )}
        {showRenewal && (
          <Button
            variant="ghost"
            onClick={() => onOpenRenewal?.()}
            className="absolute bottom-4 right-4 h-9 shrink-0 rounded-lg border border-line bg-canvas px-3"
          >
            <RefreshCw size={14} strokeWidth={1.5} />
            續訂服務
          </Button>
        )}
      </div>
    ),
  };
}
