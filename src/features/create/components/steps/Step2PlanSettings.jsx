import { AlertCircle, Check, Minus, Plus, PlusCircle, X } from 'lucide-react'
import { getServiceById } from '../../../../shared/utils/serviceUtils'

const BILLING_CYCLES = [
  { value: 'monthly', label: '月繳' },
  { value: 'yearly',  label: '年繳' },
]

function Field({ label, required, children, hint, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
        {hint && (
          <span className="group relative inline-flex">
            <AlertCircle size={14} className="text-slate-400" />
            <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-1.5 w-max max-w-[16rem] -translate-y-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {hint}
            </span>
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

export default function Step2PlanSettings({ form, onChange }) {
  const service = getServiceById(form.serviceId)
  const plan = service?.plans.find(p => p.name === form.planName)
  const maxSeats = plan?.maxSeats ?? 10
  const openSeats = form.totalSeats - 1

  function updateRule(i, val) {
    const next = [...form.rules]
    next[i] = val
    onChange('rules', next)
  }

  function addRule() {
    onChange('rules', [...form.rules, ''])
  }

  function removeRule(i) {
    onChange('rules', form.rules.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <Field label="選擇方案" required hint="選擇方案後，費用將依官方定價自動計算">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {service?.plans.filter(p => p.maxSeats > 1).map(p => {
              const active = form.planName === p.name
              return (
                <button
                  key={p.name}
                  onClick={() => onChange('planName', p.name)}
                  className={`flex items-start justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    active
                      ? 'border-brand bg-brand-subtle text-brand'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{p.name}</p>
                    <p className={`text-xs mt-0.5 ${active ? 'text-brand' : 'text-slate-400'}`}>
                      官方月費 NT${p.monthlyPrice} · 最多 {p.maxSeats} 人
                    </p>
                  </div>
                  {active && <Check size={14} className="text-brand shrink-0 mt-0.5" />}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="計費週期" required hint="選擇月繳或年繳，費用會依方案自動換算">
          <div className="flex gap-2">
            {BILLING_CYCLES.map(c => (
              <button
                key={c.value}
                onClick={() => onChange('billingCycle', c.value)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                  form.billingCycle === c.value
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="space-y-5 border-t border-line pt-6">
        <Field label="開放名額" required hint={`最多可開放 ${maxSeats - 1} 位成員加入（不含你自己）`}>
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-1 w-fit">
            <button
              onClick={() => onChange('totalSeats', Math.max(2, form.totalSeats - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-30"
              disabled={openSeats <= 1}
            >
              <Minus size={14} className="text-slate-600" />
            </button>
            <span className="w-10 text-center text-xl font-bold text-slate-800">
              {openSeats}
            </span>
            <button
              onClick={() => onChange('totalSeats', Math.min(maxSeats, form.totalSeats + 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-30"
              disabled={form.totalSeats >= maxSeats}
            >
              <Plus size={14} className="text-slate-600" />
            </button>
          </div>
        </Field>

        <Field label="帳號需求" hint="說明成員是否需要自備帳號，或有其他帳號相關條件（選填）">
          <textarea
            rows={2}
            placeholder="例如：需使用自己的 Google 帳號登入"
            value={form.requirements}
            onChange={e => onChange('requirements', e.target.value)}
            maxLength={120}
            className="field w-full resize-none"
          />
        </Field>

        <Field label="群組規則" hint="最多 5 條，清楚的規則可降低後續糾紛">
          <div className="space-y-2">
            {form.rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-4 shrink-0 text-right">{i + 1}.</span>
                <input
                  type="text"
                  placeholder="例如：每月 15 日前完成付款"
                  value={rule}
                  onChange={e => updateRule(i, e.target.value)}
                  maxLength={80}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.rules.length > 1 && (
                  <button
                    onClick={() => removeRule(i)}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
            {form.rules.length < 5 && (
              <button
                onClick={addRule}
                className="ml-6 flex items-center gap-1.5 text-sm text-brand hover:text-brand/80 mt-1"
              >
                <PlusCircle size={14} />
                新增規則
              </button>
            )}
          </div>
        </Field>
      </div>
    </div>
  )
}
