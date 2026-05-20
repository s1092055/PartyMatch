import { Check } from 'lucide-react'

const STEPS = [
  { n: 1, label: '選擇服務' },
  { n: 2, label: '方案設定' },
  { n: 3, label: '群組設定' },
  { n: 4, label: '預覽送出' },
]

export default function CreateGroupStepper({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map(({ n, label }, i) => {
        const done    = n < current
        const active  = n === current

        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                done   ? 'bg-brand text-white' :
                active ? 'bg-brand text-white ring-4 ring-brand-subtle' :
                         'bg-slate-100 text-slate-400'
              }`}>
                {done ? <Check size={14} strokeWidth={3} /> : n}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                active ? 'text-brand' : done ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>

{i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors ${
                done ? 'bg-brand' : 'bg-slate-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
