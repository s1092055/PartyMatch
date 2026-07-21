import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { getServiceById } from '../../../../shared/utils/serviceUtils'
import { getSharingMethodConfig } from '../../../../shared/utils/serviceInfoFields'
import { useMediaQuery, SHORT_LG_QUERY } from '../../../../shared/utils/hooks'
import TokenAmount from '../../../../shared/ui/TokenAmount'
import Field from './Field'

const DEFAULT_NOTICE = '此服務用 Email 邀請即可加入，各自使用獨立帳號，沒有其他特別注意事項。'

export default function Step2Plan({ form, onChange }) {
  const service = getServiceById(form.serviceId)
  const serviceInfoNotice = getSharingMethodConfig(service?.sharingMethod).notice ?? DEFAULT_NOTICE
  // 每個方案（含拆分出來的月繳／年繳版本）都是獨立可選的一張卡片，切換方案的同時就決定了收費週期
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

  // 右側「方案說明」高度要跟左側（服務說明＋選擇方案，含切換按鈕）切齊，
  // 用 ResizeObserver 量測左側實際高度，超出的部分讓右側框內部自己捲動；
  // 左右並排只在 short-lg（桌機寬度 + 螢幕不高，見 index.css）時生效，
  // 手機/平板或螢幕夠高時都維持自然高度，不套用量到的值
  const leftColRef = useRef(null)
  const [leftColHeight, setLeftColHeight] = useState(null)
  const isShortLgUp = useMediaQuery(SHORT_LG_QUERY)

  useEffect(() => {
    const el = leftColRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setLeftColHeight(entry.contentRect.height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function selectPlanAt(idx) {
    if (groupPlans.length === 0) return
    const clamped = Math.min(Math.max(idx, 0), groupPlans.length - 1)
    onChange('planName', groupPlans[clamped].name)
  }

  return (
    <div className="pb-1 short-lg:flex short-lg:items-start short-lg:gap-8">
      {/* 左：服務說明、填寫服務資訊注意事項 */}
      <div ref={leftColRef} className="flex min-w-0 flex-1 flex-col space-y-5">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-base font-medium text-slate-700">服務說明</p>
          <div className="rounded-xl bg-canvas p-3.5">
            <p className="text-sm leading-relaxed text-ink-2">{service?.description ?? '尚未選擇服務'}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-base font-medium text-slate-700">
            <Info size={16} strokeWidth={1.5} className="text-brand" />
            填寫服務資訊注意事項
          </p>
          <div className="rounded-xl bg-canvas p-3.5">
            <p className="text-sm leading-relaxed text-ink-2">{serviceInfoNotice}</p>
          </div>
        </div>
      </div>

      {/* 右：選擇方案、方案說明（內容直接接在選擇方案下方） */}
      <div
        className="mt-5 flex min-w-0 flex-1 flex-col short-lg:mt-0"
        style={isShortLgUp && leftColHeight ? { height: leftColHeight } : undefined}
      >
        <Field label="選擇方案">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectPlanAt(activeIndex - 1)}
              disabled={groupPlans.length <= 1 || activeIndex <= 0}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30"
              aria-label="上一個方案"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>

            {currentPlan ? (
              <button
                type="button"
                onClick={() => selectPlanAt(activeIndex)}
                className={`flex h-16 min-w-0 flex-1 items-center justify-center rounded-xl border-2 px-4 text-base transition-all ${
                  isPlanSelected
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <div className="min-w-0 text-center">
                  <p className="font-medium truncate">{currentPlan.name}</p>
                  <p className={`text-sm mt-0.5 flex items-center justify-center gap-1 truncate ${isPlanSelected ? 'text-brand' : 'text-slate-400'}`}>
                    <TokenAmount amount={currentPlan.monthlyPrice} badgeSize="!h-3.5 !w-3.5" unitClassName={isPlanSelected ? 'text-brand' : 'text-slate-400'} /> · {currentPlan.maxSeats} 人
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex h-16 min-w-0 flex-1 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 text-sm text-slate-400">
                尚無可選方案
              </div>
            )}

            <button
              type="button"
              onClick={() => selectPlanAt(activeIndex + 1)}
              disabled={groupPlans.length <= 1 || activeIndex >= groupPlans.length - 1}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30"
              aria-label="下一個方案"
            >
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </Field>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-xl bg-canvas p-3.5">
          {(currentPlan?.features?.length ?? 0) > 0 ? (
            <ul className="space-y-1.5">
              {currentPlan.features.map((feat, i) => (
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
    </div>
  )
}
