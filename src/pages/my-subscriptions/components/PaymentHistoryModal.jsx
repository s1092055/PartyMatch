import { CheckCircle2, Receipt } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import EmptyState from '../../../shared/components/ui/EmptyState'
import { getPaymentRecordsBySubscriptionId } from '../../../shared/stores/paymentStore'

const METHOD_LABELS = {
  manual: '手動標記',
  transfer: '銀行轉帳',
  linepay: 'LINE Pay',
}

export default function PaymentHistoryModal({ sub, isOpen, onClose }) {
  const records = isOpen && sub
    ? getPaymentRecordsBySubscriptionId(sub.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    : []

  const titleIcon = sub ? <ServiceLogo serviceId={sub.serviceId} size={28} /> : null
  const titleText = sub ? `${sub.serviceName} · ${sub.planName}` : ''

  return (
    <Modal isOpen={isOpen && !!sub} onClose={onClose} title={titleText} titleIcon={titleIcon}>
      {/* Records list */}
      <div className="max-h-[22rem] overflow-y-auto">
        {records.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="尚無付款紀錄"
            description="標記已付款後紀錄將顯示在這裡"
            className="py-12"
          />
        ) : (
          <div className="divide-y divide-line-subtle">
            {records.map(record => (
              <div key={record.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-success-subtle flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} className="text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {record.periodLabel || record.paidAt}
                  </p>
                  <p className="text-xs text-ink-3">
                    {METHOD_LABELS[record.method] ?? record.method} · {record.paidAt}
                  </p>
                </div>
                <span className="text-sm font-bold text-success shrink-0">
                  NT${record.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {records.length > 0 && (
        <div className="px-5 py-3 bg-canvas border-t border-line-subtle flex items-center justify-between">
          <span className="text-xs text-ink-3">共 {records.length} 筆付款紀錄</span>
          <span className="text-xs font-semibold text-ink-2">
            累計 NT${records.reduce((sum, r) => sum + (r.amount ?? 0), 0)}
          </span>
        </div>
      )}
    </Modal>
  )
}
