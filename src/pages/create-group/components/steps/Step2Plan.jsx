import { Check } from 'lucide-react'
import { getServiceById } from '../../../../shared/services/serviceTypes'

const BILLING_CYCLES = [
  { value: 'monthly', label: '月繳' },
  { value: 'yearly',  label: '年繳' },
]

function Field({ label, required, children, hint, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function Step2Plan({ form, onChange }) {
  const service = getServiceById(form.serviceId)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">方案設定</h2>
        <p className="text-sm text-slate-500">設定你要開放的方案與每人費用</p>
      </div>

      {/* Plan selection */}
      <Field label="選擇方案" required>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {service?.plans.map(plan => {
            const active = form.planName === plan
            return (
              <button
                key={plan}
                onClick={() => onChange('planName', plan)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {plan}
                {active && <Check size={14} className="text-blue-500" />}
              </button>
            )
          })}
        </div>
      </Field>

      {/* Price */}
      <Field
        label="每人月費（NT$）"
        required
        hint="建議參考官方定價合理分攤，設定過高可能降低吸引力"
        htmlFor="price-per-seat"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 shrink-0">NT$</span>
          <input
            id="price-per-seat"
            type="number"
            min="1"
            max="9999"
            placeholder="例如：58"
            value={form.pricePerSeat}
            onChange={e => onChange('pricePerSeat', e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-500 shrink-0">/ 月</span>
        </div>
      </Field>

      {/* Billing cycle */}
      <Field label="計費週期" required>
        <div className="flex gap-2">
          {BILLING_CYCLES.map(c => (
            <button
              key={c.value}
              onClick={() => onChange('billingCycle', c.value)}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                form.billingCycle === c.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Billing day */}
      <Field
        label="每月扣款日"
        required
        hint="建議選擇月初，方便成員準備款項"
        htmlFor="billing-day"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 shrink-0">每月</span>
          <input
            id="billing-day"
            type="number"
            min="1"
            max="31"
            placeholder="15"
            value={form.nextBillingDay}
            onChange={e => onChange('nextBillingDay', e.target.value)}
            className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-500 shrink-0">日</span>
        </div>
      </Field>
    </div>
  )
}
