import { useEffect } from 'react'
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
        {/* 左右兩欄用 items-stretch（flex row 預設行為）讓左欄自動撐到跟右欄（方案內容，
            高度隨內容自然增減、不再內部捲動）一樣高；左欄方案卡用 flex-1 吃滿撐高後多出來
            的空間，捲動箭頭自然被推到欄位最底部，不用另外用 mt-auto 對齊 */}
        <div className="md:flex md:gap-6">
          {/* 左：切換箭頭在左右兩側、方案卡在中間；上下加跟右側方案內容一樣的 p-3.5
              內距，讓卡片邊框頂部對齊方案內容第一行文字、底部對齊最後一行文字，而不是
              直接對齊到整個欄位的最頂端/最底端；卡片用 self-stretch 撐滿這一列的高度，
              箭頭維持固定大小、垂直置中 */}
          <div className="flex min-w-0 flex-1 items-center gap-2 py-3.5">
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
                className={`flex min-h-40 flex-1 items-center justify-center self-stretch rounded-xl border-2 px-4 text-base transition-all ${
                  isPlanSelected ? 'border-brand/40 text-brand' : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="min-w-0 text-center">
                  <p className="text-lg font-medium truncate">{currentPlan.name}</p>
                  <p className={`text-base mt-1 flex items-center justify-center gap-1 truncate ${isPlanSelected ? 'text-brand' : 'text-slate-400'}`}>
                    <TokenAmount amount={currentPlan.monthlyPrice} badgeSize="!h-4 !w-4" unitClassName={isPlanSelected ? 'text-brand' : 'text-slate-400'} /> · {currentPlan.maxSeats} 人
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex min-h-40 flex-1 items-center justify-center self-stretch rounded-xl border-2 border-slate-200 px-4 text-sm text-slate-400">
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

          {/* 右：方案說明，全部內容直接顯示，不內部捲動 */}
          <div className="mt-4 min-w-0 flex-1 rounded-xl bg-canvas p-3.5 md:mt-0">
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
      </Field>
    </div>
  )
}
