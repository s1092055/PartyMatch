import { useEffect, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Minus, Plus, PlusCircle, X } from 'lucide-react'
import { getServiceById } from '../../../../shared/utils/serviceUtils'

const BILLING_CYCLES = [
  { value: 'monthly', label: '月繳' },
  { value: 'yearly',  label: '年繳' },
]

const MIN_CREDIT_OPTIONS = [
  { value: 0,  label: '不限' },
  { value: 90, label: '90 分以上' },
  { value: 70, label: '70 分以上' },
  { value: 50, label: '50 分以上' },
]

function Field({ label, required, children, hint, htmlFor, className = '' }) {
  const [showHint, setShowHint] = useState(false)
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 flex items-center gap-1.5 text-base font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
        {hint && (
          <span className="group relative inline-flex">
            <button
              type="button"
              onClick={() => setShowHint(v => !v)}
              className="text-slate-400"
              aria-label="說明"
            >
              <AlertCircle size={16} />
            </button>
            <span className={`pointer-events-none absolute left-full top-1/2 z-10 ml-1.5 w-max max-w-[16rem] -translate-y-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-sm font-normal leading-relaxed text-white shadow-lg transition-opacity group-hover:opacity-100 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
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
  const groupPlans = service?.plans.filter(p => p.maxSeats > 1) ?? []
  const activeIndex = Math.max(0, groupPlans.findIndex(p => p.name === form.planName))
  const currentPlan = groupPlans[activeIndex]
  const isPlanSelected = currentPlan && form.planName === currentPlan.name

  useEffect(() => {
    if (!form.planName && groupPlans.length > 0) {
      onChange('planName', groupPlans[0].name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.serviceId])

  function selectPlanAt(idx) {
    if (groupPlans.length === 0) return
    const clamped = Math.min(Math.max(idx, 0), groupPlans.length - 1)
    onChange('planName', groupPlans[clamped].name)
  }

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
    <div className="lg:flex lg:items-stretch lg:gap-8">
      {/* 左：選擇方案、收費週期、開放名額 */}
      <div className="flex min-w-0 flex-1 flex-col space-y-5">
        <Field label="選擇方案" required hint="選擇方案後，費用將依官方定價自動計算">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectPlanAt(activeIndex - 1)}
              disabled={groupPlans.length <= 1 || activeIndex <= 0}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30"
              aria-label="上一個方案"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="min-w-0 flex-1">
              {currentPlan ? (
                <button
                  type="button"
                  onClick={() => selectPlanAt(activeIndex)}
                  className={`flex h-16 w-full items-center justify-center rounded-xl border-2 px-4 text-base transition-all ${
                    isPlanSelected
                      ? 'border-brand bg-brand-subtle text-brand'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div className="min-w-0 text-center">
                    <p className="font-medium truncate">{currentPlan.name}</p>
                    <p className={`text-sm mt-0.5 truncate ${isPlanSelected ? 'text-brand' : 'text-slate-400'}`}>
                      NT${currentPlan.monthlyPrice} · {currentPlan.maxSeats} 人
                    </p>
                  </div>
                </button>
              ) : (
                <div className="flex h-16 w-full items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 text-sm text-slate-400">
                  尚無可選方案
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => selectPlanAt(activeIndex + 1)}
              disabled={groupPlans.length <= 1 || activeIndex >= groupPlans.length - 1}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30"
              aria-label="下一個方案"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </Field>

        <Field label="收費週期" required hint="選擇月繳或年繳，費用會依方案自動換算">
          <div className="flex gap-2">
            {BILLING_CYCLES.map(c => (
              <button
                key={c.value}
                onClick={() => onChange('billingCycle', c.value)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-base font-medium transition-colors ${
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

        <Field label="開放名額" required hint={`最多可開放 ${maxSeats - 1} 位成員加入（不含你自己）`}>
          <div className="flex w-full items-center justify-between gap-3 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => onChange('totalSeats', Math.max(2, form.totalSeats - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-30"
              disabled={openSeats <= 1}
            >
              <Minus size={14} className="text-slate-600" />
            </button>
            <span className="text-center text-2xl font-bold text-slate-800">
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

        <Field label="信用分數" hint="設定申請人需達到的最低信用分數門檻，篩掉高風險使用者">
          <div className="flex gap-2">
            {MIN_CREDIT_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => onChange('minCreditScore', o.value)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                  (form.minCreditScore ?? 0) === o.value
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* 右：帳號需求、群組規則 */}
      <div className="mt-6 flex flex-1 flex-col space-y-5 lg:mt-0">
        <Field label="帳號需求" hint="說明成員是否需要自備帳號，或有其他帳號相關條件（選填）">
          <textarea
            rows={2}
            placeholder="例如：需使用自己的 Google 帳號登入"
            value={form.requirements}
            onChange={e => onChange('requirements', e.target.value)}
            maxLength={120}
            className="field w-full resize-none text-base"
          />
        </Field>

        <Field label="群組規則" hint="最多 5 條，清楚的規則可降低後續糾紛">
          <div className="space-y-2">
            {form.rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-slate-400 w-4 shrink-0 text-right">{i + 1}.</span>
                <input
                  type="text"
                  placeholder="例如：每月 15 日前完成付款"
                  value={rule}
                  onChange={e => updateRule(i, e.target.value)}
                  maxLength={80}
                  className="field flex-1 text-base"
                />
                {form.rules.length > 1 && (
                  <button
                    onClick={() => removeRule(i)}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            ))}
            {form.rules.length < 5 && (
              <button
                onClick={addRule}
                className="ml-6 flex items-center gap-1.5 text-base text-brand hover:text-brand/80 mt-1"
              >
                <PlusCircle size={16} />
                新增規則
              </button>
            )}
          </div>
        </Field>
      </div>
    </div>
  )
}
