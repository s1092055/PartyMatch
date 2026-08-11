import { FileText, ListChecks, Minus, Plus, ShieldCheck, Users } from 'lucide-react'
import { getServiceById } from '../../../../common/utils/serviceUtils'
import Field from './Field'
import { Input, Textarea } from '../../../../components/ui/input'
import CreditScoreValue from '../../../../components/ui/CreditScoreValue'

const MIN_CREDIT_OPTIONS = [0, 90, 70, 50]

export default function Step3Settings({ form, onChange }) {
  const service = getServiceById(form.serviceId)
  const plan = service?.plans.find(p => p.name === form.planName)
  const maxSeats = plan?.maxSeats ?? 10
  const openSeats = form.totalSeats - 1

  function updateRule(i, val) {
    const next = [...form.rules]
    next[i] = val
    onChange('rules', next)
  }

  return (
    <div className="pb-3 short-lg:flex short-lg:items-stretch short-lg:gap-8">
      {/* 左：開放名額、信用分數、帳號需求 */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-5 px-1 pb-1">
        <Field
          label="開放名額"
          icon={Users}
          required
          hint={`最多可開放 ${maxSeats - 1} 位成員加入（不含你自己）`}
          endAdornment={<span className="text-sm font-normal text-slate-400">最多 {maxSeats} 人共享</span>}
        >
          <div className="flex w-full items-center justify-between gap-3 border border-slate-200 rounded-lg p-1">
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

        <Field label="信用分數" icon={ShieldCheck} hint="申請人需達到的最低信用分數門檻">
          <div className="flex gap-2">
            {MIN_CREDIT_OPTIONS.map(score => (
              <button
                key={score}
                onClick={() => onChange('minCreditScore', score)}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  (form.minCreditScore ?? 0) === score
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-slate-200 bg-surface text-slate-600 hover:border-slate-300'
                }`}
              >
                <CreditScoreValue score={score} className="justify-center" />
              </button>
            ))}
          </div>
        </Field>

        <Field label="帳號需求" icon={FileText} hint="帳號相關條件（選填）" className="flex min-h-0 flex-1 flex-col">
          <Textarea
            placeholder="例如：需使用自己的 Google 帳號登入"
            value={form.requirements}
            onChange={e => onChange('requirements', e.target.value)}
            maxLength={120}
            className="min-h-32 flex-1"
          />
        </Field>
      </div>

      {/* 右：群組規則 —— 固定顯示 5 列，允許留白，不用另外新增/移除 */}
      <Field
        label="群組規則"
        icon={ListChecks}
        hint="最多 5 條，留空即不設定"
        className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col px-1 pb-1 short-lg:mt-0"
      >
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
          {form.rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-slate-400 w-4 shrink-0 text-right">{i + 1}.</span>
              <Input
                type="text"
                placeholder="例如：每月 15 日前完成付款"
                value={rule}
                onChange={e => updateRule(i, e.target.value)}
                maxLength={80}
                className="flex-1 py-3 text-base"
              />
            </div>
          ))}
        </div>
      </Field>
    </div>
  )
}
