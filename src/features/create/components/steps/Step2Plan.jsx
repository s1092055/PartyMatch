import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Info, Layers, Package } from 'lucide-react'
import { getServiceById } from '../../../../shared/utils/serviceUtils'
import { getSharingMethodConfig } from '../../../../shared/utils/serviceInfoFields'
import TokenAmount from '../../../../shared/ui/TokenAmount'
import Field from './Field'

const DEFAULT_NOTICE = '此服務用 Email 邀請即可加入，各自使用獨立帳號，沒有其他特別注意事項。'

export default function Step2Plan({ form, onChange }) {
  const service = getServiceById(form.serviceId)
  const serviceInfoNotice = getSharingMethodConfig(service?.sharingMethod).notice ?? DEFAULT_NOTICE
  // 每個方案（含拆分出來的月繳／年繳版本）都是獨立可選的一張卡片，切換方案的同時就決定了收費週期
  const groupPlans = service?.plans.filter(p => p.maxSeats > 1) ?? []
  const selectedPlan = groupPlans.find(p => p.name === form.planName)

  useEffect(() => {
    if (!form.planName && groupPlans.length > 0) {
      onChange('planName', groupPlans[0].name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.serviceId])

  // 方案卡片由左到右排成一列，超出可視寬度才顯示左右捲動箭頭；
  // 用 scroll 事件 + ResizeObserver 判斷目前是否還能往左/右捲，兩者皆否代表沒有 overflow，不顯示箭頭
  const rowRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    function updateScrollState() {
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    updateScrollState()
    el.addEventListener('scroll', updateScrollState)
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [groupPlans.length])

  const hasOverflow = canScrollLeft || canScrollRight

  function scrollRow(dir) {
    rowRef.current?.scrollBy({ left: dir * 176, behavior: 'smooth' })
  }

  return (
    <div className="space-y-5 pb-1">
      <Field label="服務說明" icon={Package}>
        <div className="rounded-xl bg-canvas p-3.5">
          <p className="text-sm leading-relaxed text-ink-2">{service?.description ?? '尚未選擇服務'}</p>
        </div>
      </Field>

      <Field label="填寫服務資訊注意事項" icon={Info}>
        <div className="rounded-xl bg-canvas p-3.5">
          <p className="text-sm leading-relaxed text-ink-2">{serviceInfoNotice}</p>
        </div>
      </Field>

      <Field label="選擇方案" icon={Layers}>
        <div className="flex items-center gap-2">
          {hasOverflow && (
            <button
              type="button"
              onClick={() => scrollRow(-1)}
              disabled={!canScrollLeft}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30"
              aria-label="向左捲動"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
          )}

          {groupPlans.length > 0 ? (
            <div
              ref={rowRef}
              className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {groupPlans.map(plan => {
                const isSelected = form.planName === plan.name
                return (
                  <button
                    key={plan.name}
                    type="button"
                    onClick={() => onChange('planName', plan.name)}
                    className={`flex h-16 w-40 shrink-0 items-center justify-center rounded-xl border-2 px-3 text-base transition-all ${
                      isSelected
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="min-w-0 text-center">
                      <p className="font-medium truncate">{plan.name}</p>
                      <p className={`text-sm mt-0.5 flex items-center justify-center gap-1 truncate ${isSelected ? 'text-brand' : 'text-slate-400'}`}>
                        <TokenAmount amount={plan.monthlyPrice} badgeSize="!h-3.5 !w-3.5" unitClassName={isSelected ? 'text-brand' : 'text-slate-400'} /> · {plan.maxSeats} 人
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex h-16 min-w-0 flex-1 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 text-sm text-slate-400">
              尚無可選方案
            </div>
          )}

          {hasOverflow && (
            <button
              type="button"
              onClick={() => scrollRow(1)}
              disabled={!canScrollRight}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30"
              aria-label="向右捲動"
            >
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </Field>

      <div className="rounded-xl bg-canvas p-3.5">
        {(selectedPlan?.features?.length ?? 0) > 0 ? (
          <ul className="space-y-1.5">
            {selectedPlan.features.map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand" />
                {feat}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-4">此方案尚無詳細說明</p>
        )}
      </div>
    </div>
  )
}
