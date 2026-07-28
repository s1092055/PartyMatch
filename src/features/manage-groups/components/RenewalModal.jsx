import { Calendar, RefreshCw, XCircle } from 'lucide-react'
import Modal from '../../../shared/ui/primitives/Modal'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import Badge from '../../../shared/ui/primitives/Badge'
import { advanceByCycle, daysUntil, toISODate } from '../../../shared/utils/date'

export default function RenewalModal({ isOpen, onClose, group, onStartRenewal, onEndGroup }) {
  if (!group) return null

  const days = daysUntil(group.nextBillingDate)
  const isOverdue = days < 0
  const currentBillingDate = toISODate(group.nextBillingDate)
  const nextCycleDate = toISODate(advanceByCycle(group.nextBillingDate, group.billingCycle))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="續訂管理"
      icon={<RefreshCw size={16} className="text-brand" />}
      maxWidth="max-w-sm"
      sub
    >
      <div className="p-5">
        
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-raised p-3">
          <ServiceLogo serviceId={group.serviceId} size={36} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-ink">{group.serviceName}</p>
            <p className="text-xs text-ink-3">{group.planName}</p>
          </div>
          <Badge variant={group.status} />
        </div>

<div className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 ${
          isOverdue ? 'border-danger/30 bg-danger-subtle/60' : 'border-warning/30 bg-amber-50/60'
        }`}>
          <Calendar size={15} className={isOverdue ? 'shrink-0 text-danger' : 'shrink-0 text-warning-text'} />
          <div>
            <p className={`text-sm font-bold ${isOverdue ? 'text-danger' : 'text-warning-text'}`}>
              {isOverdue ? `帳單日已過 ${Math.abs(days)} 天` : `距帳單日還有 ${days} 天`}
            </p>
            <p className="text-xs text-ink-3">本期帳單日：{currentBillingDate}</p>
          </div>
        </div>

<p className="mb-3 text-xs font-semibold text-ink-3">選擇下一步操作</p>

        <button
          onClick={onStartRenewal}
          className="mb-3 w-full rounded-2xl border-2 border-brand bg-brand-subtle p-4 text-left transition-colors hover:bg-brand/10"
        >
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="shrink-0 text-brand" />
            <p className="font-bold text-brand">開始新一期收款</p>
          </div>
          <p className="mt-1.5 text-xs text-ink-3">
            將立即向每位成員收取本期費用並代管，下期帳單日設為 {nextCycleDate}，成員會收到通知並需重新填寫服務帳號資訊。
          </p>
        </button>

        <button
          onClick={onEndGroup}
          className="w-full rounded-2xl border-2 border-line p-4 text-left transition-colors hover:border-danger/40 hover:bg-danger-subtle/50"
        >
          <div className="flex items-center gap-2">
            <XCircle size={16} className="shrink-0 text-danger" />
            <p className="font-bold text-danger">結束服務</p>
          </div>
          <p className="mt-1.5 text-xs text-ink-3">
            群組將進入「已結束」狀態，不再續訂，成員可繼續使用至 {currentBillingDate}。
          </p>
        </button>

      </div>
    </Modal>
  )
}
