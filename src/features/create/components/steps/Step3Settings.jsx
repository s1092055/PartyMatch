import { useLayoutEffect, useRef, useState } from 'react'
import { Minus, Plus, PlusCircle, X } from 'lucide-react'
import { getServiceById } from '../../../../shared/utils/serviceUtils'
import { useMediaQuery, SHORT_LG_QUERY } from '../../../../shared/utils/hooks'
import Field from './Field'

const MIN_CREDIT_OPTIONS = [
  { value: 0,  label: '不限' },
  { value: 90, label: '90 分以上' },
  { value: 70, label: '70 分以上' },
  { value: 50, label: '50 分以上' },
]

export default function Step3Settings({ form, onChange }) {
  const service = getServiceById(form.serviceId)
  const plan = service?.plans.find(p => p.name === form.planName)
  const maxSeats = plan?.maxSeats ?? 10
  const openSeats = form.totalSeats - 1

  // 帳號需求 textarea 的底部要對齊右欄群組規則最後一項的底部，兩欄並排只在 short-lg 生效
  // （見 index.css），兩欄內容天生不等高，只能量測實際位置後直接設定 textarea 高度
  const textareaRef = useRef(null)
  const lastRuleRef = useRef(null)
  const [textareaHeight, setTextareaHeight] = useState(null)
  const isShortLgUp = useMediaQuery(SHORT_LG_QUERY)

  useLayoutEffect(() => {
    function sync() {
      const textarea = textareaRef.current
      const lastRule = lastRuleRef.current
      if (!textarea || !lastRule || !isShortLgUp) {
        setTextareaHeight(prev => (prev === null ? prev : null))
        return
      }
      const height = lastRule.getBoundingClientRect().bottom - textarea.getBoundingClientRect().top
      const next = Math.max(32, Math.round(height))
      setTextareaHeight(prev => (prev === next ? prev : next))
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [form.rules.length, isShortLgUp])

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
    <div className="pb-3 short-lg:flex short-lg:h-96 short-lg:items-stretch short-lg:gap-8">
      {/* 左：剩餘名額、信用分數、帳號需求 */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-5 overflow-y-auto pb-1 pl-1 pr-1">
        <Field label="剩餘名額" required hint={`最多可開放 ${maxSeats - 1} 位成員加入（不含你自己）`}>
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

        <Field label="帳號需求" hint="說明成員是否需要自備帳號，或有其他帳號相關條件（選填）">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="例如：需使用自己的 Google 帳號登入"
            value={form.requirements}
            onChange={e => onChange('requirements', e.target.value)}
            maxLength={120}
            style={textareaHeight ? { height: textareaHeight } : undefined}
            className="field w-full resize-none text-base"
          />
        </Field>
      </div>

      {/* 右：群組規則 */}
      <div className="mt-6 flex flex-1 flex-col space-y-1 short-lg:mt-0">
        <Field label="群組規則" hint="最多 5 條，清楚的規則可降低後續糾紛">
          <div className="space-y-1">
            {form.rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-slate-400 w-4 shrink-0 text-right">{i + 1}.</span>
                <input
                  ref={i === form.rules.length - 1 ? lastRuleRef : undefined}
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
