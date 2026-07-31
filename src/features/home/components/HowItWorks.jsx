import { useState } from 'react'
import { Users, PlusCircle } from 'lucide-react'
import { MEMBER_STEPS, HOST_STEPS } from '../data/homeContent'

const ROLES = [
  { key: 'member', label: '加入群組', icon: Users, steps: MEMBER_STEPS, color: 'text-brand', bg: 'bg-brand', subtle: 'bg-brand-subtle' },
  { key: 'host',   label: '建立群組', icon: PlusCircle, steps: HOST_STEPS, color: 'text-success', bg: 'bg-success', subtle: 'bg-success/10' },
]

export default function HowItWorks() {
  const [roleKey, setRoleKey] = useState('member')
  const role = ROLES.find(r => r.key === roleKey)

  return (
    <section className="py-6">
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">使用流程</p>
        <h2 className="text-3xl font-extrabold text-ink">使用情境</h2>
        <p className="mt-3 text-base text-ink-3">選擇您的身分，了解完整的操作流程。</p>
      </div>

      {/* 角色切換 */}
      <div className="mx-auto mb-10 flex max-w-sm gap-1 rounded-2xl bg-raised p-1">
        {ROLES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setRoleKey(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-bold transition-colors ${
              roleKey === key ? 'bg-surface text-ink shadow-sm' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* 步驟列表 */}
      <div key={roleKey} className="mx-auto max-w-lg animate-step-slide-up">
        {role.steps.map(({ step, title, desc }, i) => (
          <div key={step} className="flex gap-4">
            {/* 左側：數字 + 連接線 */}
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${role.bg} text-sm font-extrabold text-white`}>
                {step}
              </div>
              {i < role.steps.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-line" style={{ minHeight: '2rem' }} />
              )}
            </div>

            {/* 右側：內容 */}
            <div className={`pb-8 ${i === role.steps.length - 1 ? 'pb-0' : ''}`}>
              <h3 className="pt-1.5 text-base font-extrabold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-3">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
