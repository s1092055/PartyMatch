import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, MessageSquare, X } from 'lucide-react'
import { getGroupById } from '../../shared/stores/groupStore'
import { getServiceById } from '../../shared/services/serviceTypes'
import { useScrollLock } from '../../shared/utils/hooks'
import CreditScoreBadge from '../../shared/components/ui/CreditScoreBadge'
import SectionCard from '../../shared/components/ui/SectionCard'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import GroupHeroCard from './components/GroupHeroCard'
import StickyJoinSummary from './components/StickyJoinSummary'

const PREVIEW_COUNT = 3

export default function GroupDetailModal() {
  const [groupId, setGroupId] = useState(null)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const isOpen = !!groupId
  useScrollLock(isOpen)

  useEffect(() => {
    function onOpen(e) {
      setGroupId(e.detail?.groupId ?? null)
      setShowAllReviews(false)
    }
    window.addEventListener('pm:open-group', onOpen)
    return () => window.removeEventListener('pm:open-group', onOpen)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    function onEsc(e) { if (e.key === 'Escape') setGroupId(null) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [isOpen])

  if (!isOpen) return null

  const group = getGroupById(groupId)
  const service = group ? getServiceById(group.serviceId) : null
  const plan = service?.plans.find(p => p.name === group?.planName)

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={() => setGroupId(null)} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-end justify-center md:items-center md:p-8">
        <div
          className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-2xl bg-canvas shadow-2xl md:max-w-5xl md:rounded-2xl"
          style={{ height: 'min(92vh, 860px)' }}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4">
            <span className="text-base font-extrabold text-ink">
              {group ? group.serviceName : '群組詳情'}
            </span>
            <button
              onClick={() => setGroupId(null)}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!group ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-3">
                <AlertCircle size={40} className="text-ink-4" />
                <p className="font-semibold">找不到此群組</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 p-4 md:p-6 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <GroupHeroCard group={group} />

                  {(plan?.features?.length > 0 || plan?.description || service?.plans?.length > 1) && (
                    <SectionCard
                      title="方案說明"
                      subtitle={group.planName}
                      action={<ServiceLogo serviceId={group.serviceId} size={28} className="rounded-lg" />}
                      className="mb-4"
                    >
                      {plan?.description && (
                        <p className="mb-4 text-sm leading-relaxed text-ink-2">{plan.description}</p>
                      )}
                      {plan?.features?.length > 0 && (
                        <ul className="space-y-2">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      {service?.plans?.length > 1 && (
                        <div className="mt-4 border-t border-line-subtle pt-4">
                          <p className="mb-2 text-xs font-semibold text-ink-4">此服務的其他方案</p>
                          <div className="space-y-2">
                            {service.plans.filter(p => p.name !== group.planName).map(p => (
                              <div key={p.name} className="flex items-start gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-ink-2">{p.name}</p>
                                  {p.description && <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{p.description}</p>}
                                </div>
                                <span className="shrink-0 text-sm font-bold text-ink-3">NT${p.monthlyPrice}<span className="text-xs font-normal">/月</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </SectionCard>
                  )}

                  <SectionCard title="加入條件與規則" subtitle="加入前請仔細閱讀" className="mb-4">
                    {group.requirements && (
                      <div className="mb-4 flex items-start gap-2 rounded-[var(--radius-inner)] bg-brand-subtle px-3 py-2.5 text-sm text-brand">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                        <span>{group.requirements}</span>
                      </div>
                    )}
                    <ul className="space-y-2">
                      {(group.rules ?? []).map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>

                  <SectionCard
                    title="團主信用"
                    subtitle={`${group.hostReviewCount} 則評價`}
                    action={<CreditScoreBadge score={group.hostRating} size="md" />}
                  >
                    <div className="space-y-4">
                      {((showAllReviews ? group.reviews : (group.reviews ?? []).slice(0, PREVIEW_COUNT)) ?? []).map(review => (
                        <div key={review.id} className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-ink-2">
                            {review.author[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-ink-2">{review.author}</span>
                              <span className="shrink-0 text-xs text-ink-3">{review.date}</span>
                            </div>
                            <p className="text-sm leading-relaxed text-ink-3">{review.comment}</p>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setShowAllReviews(v => !v)}
                        className="mt-1 flex items-center gap-1 text-sm text-brand hover:underline"
                      >
                        <MessageSquare size={13} />
                        {showAllReviews ? '收起評價' : `查看全部 ${group.hostReviewCount} 則評價`}
                      </button>
                    </div>
                  </SectionCard>
                </div>

                <div className="w-full shrink-0 lg:w-[25rem]">
                  <StickyJoinSummary group={group} inModal />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
