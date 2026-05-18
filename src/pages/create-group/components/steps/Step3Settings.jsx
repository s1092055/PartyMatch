import { Minus, Plus, X, PlusCircle } from 'lucide-react'
import { getServiceById } from '../../../../shared/services/serviceTypes'

const JOIN_MODES = [
  { value: 'approval', label: '需要審核', desc: '你可以審查每位申請者' },
  { value: 'instant',  label: '直接加入', desc: '符合條件即可立即加入' },
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

export default function Step3Settings({ form, onChange }) {
  const plan = getServiceById(form.serviceId)?.plans.find(p => p.name === form.planName)
  const maxSeats = plan?.maxSeats ?? 10
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
        <h2 className="text-base font-semibold text-slate-800 mb-1">群組設定</h2>
        <p className="text-sm text-slate-500">設定名額、描述與加入規則</p>
      </div>

      {/* Seat count */}
      <Field label="開放名額" required hint={`包含你自己在內的總人數上限（此方案最多 ${maxSeats} 人）`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => onChange('totalSeats', Math.max(2, form.totalSeats - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-30"
              disabled={form.totalSeats <= 2}
            >
              <Minus size={14} className="text-slate-600" />
            </button>
            <span className="w-10 text-center text-xl font-bold text-slate-800">
              {form.totalSeats}
            </span>
            <button
              onClick={() => onChange('totalSeats', Math.min(maxSeats, form.totalSeats + 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-30"
              disabled={form.totalSeats >= maxSeats}
            >
              <Plus size={14} className="text-slate-600" />
            </button>
          </div>
          <div className="flex flex-col gap-0.5 text-sm text-slate-500">
            <span>已使用名額：<strong className="text-slate-700">1</strong>（團主）</span>
            <span>每人月費：<strong className="text-blue-600">NT${form.pricePerSeat}</strong></span>
          </div>
        </div>
      </Field>

      {/* Group name */}
      <Field label="群組名稱" required hint="讓成員更容易識別你的群組" htmlFor="group-name">
        <input
          id="group-name"
          type="text"
          placeholder={`例如：陳大文的 Spotify Family 群組`}
          value={form.groupName}
          onChange={e => onChange('groupName', e.target.value)}
          maxLength={40}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{form.groupName.length}/40</p>
      </Field>

      {/* Description */}
      <Field label="群組描述" required hint="說明你的群組特色，吸引合適的成員" htmlFor="group-description">
        <textarea
          id="group-description"
          placeholder="歡迎加入我的群組！說明一下群組的特色與使用方式…"
          value={form.description}
          onChange={e => onChange('description', e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{form.description.length}/300</p>
      </Field>

      {/* Application notice */}
      <Field label="申請須知" hint="告知申請者需要注意什麼（選填）" htmlFor="application-notice">
        <textarea
          id="application-notice"
          placeholder="歡迎加入我的群組，每一位成員都需要遵守以下規則加入。"
          value={form.applicationNotice}
          onChange={e => onChange('applicationNotice', e.target.value)}
          rows={2}
          maxLength={200}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{form.applicationNotice.length}/200</p>
      </Field>

      {/* Rules */}
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

      {/* Join mode */}
      <Field label="加入方式" required>
        <div className="grid grid-cols-2 gap-3">
          {JOIN_MODES.map(m => (
            <button
              key={m.value}
              onClick={() => onChange('joinMode', m.value)}
              className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                form.joinMode === m.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className={`text-sm font-semibold mb-0.5 ${
                form.joinMode === m.value ? 'text-blue-700' : 'text-slate-700'
              }`}>
                {m.label}
              </span>
              <span className="text-xs text-slate-400">{m.desc}</span>
            </button>
          ))}
        </div>
      </Field>
    </div>
  )
}
