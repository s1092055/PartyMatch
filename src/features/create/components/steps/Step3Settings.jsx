import { Minus, Plus, X, PlusCircle } from 'lucide-react'
import { getServiceById } from '../../../../shared/utils/serviceUtils'

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

export default function Step3Settings({ form, onChange }) {
  const plan = getServiceById(form.serviceId)?.plans.find(p => p.name === form.planName)
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
    <div className="space-y-5">
      <div>
        <h2 className="mb-0.5 text-base font-extrabold text-ink">群組設定</h2>
        <p className="text-xs text-ink-3">設定開放名額、描述與加入規則</p>
      </div>

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

<Field label="群組規則" hint="清楚的規則可降低後續糾紛（最多 5 條）">
        <div className="space-y-2">
          {form.rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-4 shrink-0 text-right">{i + 1}.</span>
              <input
                type="text"
                placeholder={`例如：每月 15 日前完成付款`}
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
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-1"
            >
              <PlusCircle size={14} />
              新增規則
            </button>
          )}
        </div>
      </Field>
    </div>
  )
}
