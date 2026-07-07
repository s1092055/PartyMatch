import { CreditCard } from 'lucide-react'
import PaymentMethodsTab from './PaymentMethodsTab'

export default function TokenTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard size={15} className="text-ink-3" />
        <span className="text-sm font-semibold text-ink-2">付款方式</span>
      </div>
      <PaymentMethodsTab />
    </div>
  )
}
