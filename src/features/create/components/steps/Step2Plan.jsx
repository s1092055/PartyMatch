import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Layers, ListChecks, Package } from 'lucide-react'
import { getServiceById } from '../../../../common/utils/serviceUtils'
import { getSharingMethodConfig } from '../../../../common/utils/serviceInfoFields'
import TokenAmount from '../../../../components/ui/TokenAmount'
import { resolvePlanDisplayPrice } from '../../../../common/utils/resolvePlanDisplayPrice'
import { useUsdToTwdRate } from '../../../../common/utils/exchangeRate'
import ServiceHeroCard from '../ServiceHeroCard'
import Field from './Field'

const DEFAULT_NOTICE = '此服務用 Email 邀請即可加入，各自使用獨立帳號，沒有其他特別注意事項。';

export default function Step2Plan({ form, onChange }) {
  const usdToTwdRate = useUsdToTwdRate()
  const service = getServiceById(form.serviceId)
  const sharingMethodConfig = getSharingMethodConfig(service?.sharingMethod)
  const serviceInfoNotice = sharingMethodConfig.previewNotice ?? sharingMethodConfig.notice ?? DEFAULT_NOTICE
  const groupPlans = service?.plans.filter(p => p.maxSeats > 1) ?? [];
  const activeIndex = Math.max(0, groupPlans.findIndex(p => p.name === form.planName))
  const currentPlan = groupPlans[activeIndex]
  const isPlanSelected = currentPlan && form.planName === currentPlan.name
  const planDisplayName = currentPlan?.name.replace(/（(?:月|年)繳）\s*$/, '').trim();
  const planPriceAmount = currentPlan ? resolvePlanDisplayPrice(currentPlan, usdToTwdRate).amount : 0

  useEffect(() => {
    if (!form.planName && groupPlans.length > 0) {
      onChange('planName', groupPlans[0].name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.serviceId])

  const planCardRef = useRef(null)
  const [planNoticeMaxHeight, setPlanNoticeMaxHeight] = useState(null)

  useLayoutEffect(() => {
    const el = planCardRef.current
    if (!el) return
    function measure() {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      setPlanNoticeMaxHeight(isDesktop ? el.offsetHeight : null)
    }
    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [form.serviceId, form.planName])

  function selectPlanAt(idx) {
    if (groupPlans.length === 0) return
    const clamped = Math.min(Math.max(idx, 0), groupPlans.length - 1)
    onChange('planName', groupPlans[clamped].name)
  }

  return (
    <div className="grid grid-cols-1 gap-5 pb-1 lg:grid-cols-2 lg:items-start">
      <ServiceHeroCard form={form} service={service} className="lg:col-start-1 lg:row-start-1" />

      <Field ref={planCardRef} label="選擇方案" icon={Layers} className="lg:col-start-1 lg:row-start-2">

        <div className="flex min-w-0 flex-1 items-center gap-2 py-3.5">
          <button
            type="button"
            onClick={() => selectPlanAt(activeIndex - 1)}
            disabled={groupPlans.length <= 1 || activeIndex <= 0}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-3 transition-colors hover:bg-raised disabled:opacity-50"
            aria-label="上一個方案"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>

          {currentPlan ? (
            <button
              type="button"
              onClick={() => selectPlanAt(activeIndex)}
              className={`flex min-h-40 min-w-0 flex-1 items-center justify-center self-stretch rounded-lg border-2 px-4 text-base transition-all ${
                isPlanSelected ? 'border-brand/40 text-brand' : 'border-line text-ink-3'
              }`}
            >
              <div className="min-w-0 text-center">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${isPlanSelected ? 'bg-brand text-white' : 'bg-raised text-ink-3'}`}>
                  {currentPlan.billingCycle === 'yearly' ? '年繳' : '月繳'}
                </span>
                <p className="mt-2 text-xl font-semibold truncate">{planDisplayName}</p>
                <p className={`mt-2 flex items-center justify-center gap-1 truncate text-sm ${isPlanSelected ? 'text-brand' : 'text-ink-3'}`}>
                  <TokenAmount
                    amount={planPriceAmount}
                    badgeSize="!h-4 !w-4"
                    unitClassName={isPlanSelected ? 'text-brand' : 'text-ink-3'}
                  />
                </p>
                <p className={`mt-1 truncate text-sm ${isPlanSelected ? 'text-brand' : 'text-ink-3'}`}>
                  最多 {currentPlan.maxSeats} 人共享
                </p>
              </div>
            </button>
          ) : (
            <div className="flex min-h-40 flex-1 items-center justify-center self-stretch rounded-lg border-2 border-line px-4 text-sm text-ink-4">
              尚無可選方案
            </div>
          )}

          <button
            type="button"
            onClick={() => selectPlanAt(activeIndex + 1)}
            disabled={groupPlans.length <= 1 || activeIndex >= groupPlans.length - 1}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-3 transition-colors hover:bg-raised disabled:opacity-50"
            aria-label="下一個方案"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </Field>

      <Field label="服務說明" icon={Package} hint={serviceInfoNotice} className="lg:col-start-2 lg:row-start-1">
        <div className="rounded-lg bg-canvas p-3.5">
          <p className="text-sm leading-relaxed text-ink-2">{service?.description ?? '尚未選擇服務'}</p>
        </div>
      </Field>

      <Field
        label="方案說明"
        icon={ListChecks}
        className="lg:col-start-2 lg:row-start-2 lg:flex lg:min-h-0 lg:flex-col"
        style={planNoticeMaxHeight ? { maxHeight: planNoticeMaxHeight } : undefined}
      >
        <div className="overflow-y-auto rounded-lg bg-canvas p-3.5 lg:min-h-0 lg:flex-1">
          {(currentPlan?.features?.length ?? 0) > 0 ? (
            <ul className="space-y-1.5">
              {currentPlan.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                  <CheckCircle2 strokeWidth={1.5} size={14} className="mt-0.5 shrink-0 text-brand" />
                  {feat}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-4">此方案尚無詳細說明</p>
          )}
        </div>
      </Field>
    </div>
  );
}
