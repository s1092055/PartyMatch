import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock,
  CreditCard, Heart, Info, LogIn, MessageCircle, Play, ShieldCheck, Star,
  User, Users, X,
} from 'lucide-react'
import { getGroupById, getGroups } from '../../shared/stores/groupStore'
import { getServiceById } from '../../shared/services/serviceTypes'
import { getApplicationByUserAndGroup } from '../../shared/stores/applicationStore'
import { isCurrentUserMember, getMemberByUserAndGroup } from '../../shared/stores/memberStore'
import { isGroupFavorited, toggleFavorite } from '../../shared/stores/favoriteStore'
import { getActiveUser } from '../../shared/stores/userStore'
import { useScrollLock } from '../../shared/utils/hooks'
import Avatar from '../../shared/components/ui/Avatar'
import Button from '../../shared/components/ui/Button'
import ProgressBar from '../../shared/components/ui/ProgressBar'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import ApplyJoinModal from './components/ApplyJoinModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  recruiting:           '招募中',
  full:                 '已額滿',
  pending_confirmation: '等待確認',
  pending_activation:   '等待啟用',
  active:               '進行中',
  paused:               '已暫停',
  cancelled:            '已取消',
  ended:                '已結束',
}

const TAG_CONFIG = {
  '審核制':    { Icon: Clock,     cls: 'bg-amber-50  border border-amber-200 text-amber-700'  },
  '每月付款':  { Icon: Calendar,  cls: 'bg-blue-50   border border-blue-200  text-blue-700'   },
  '年付':      { Icon: Calendar,  cls: 'bg-blue-50   border border-blue-200  text-blue-700'   },
  '需自備帳號': { Icon: User,     cls: 'bg-green-50  border border-green-200 text-green-700'  },
  '共享帳號':  { Icon: Users,     cls: 'bg-purple-50 border border-purple-200 text-purple-700' },
  '自動加入':  { Icon: CheckCircle2, cls: 'bg-teal-50 border border-teal-200 text-teal-700'   },
}
const DEFAULT_TAG = { Icon: Info, cls: 'bg-raised border border-line text-ink-2' }

function TagChip({ label, size = 'md' }) {
  const { Icon, cls } = TAG_CONFIG[label] ?? DEFAULT_TAG
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const iconSize = size === 'sm' ? 10 : 12
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full font-semibold ${textSize} ${px} ${cls}`}>
      <Icon size={iconSize} />
      {label}
    </span>
  )
}


// ─── Compact recommendation card ──────────────────────────────────────────────

function GroupRecommendCard({ group }) {
  const usedRatio = group.totalSeats > 0 ? Math.min(group.usedSeats / group.totalSeats, 1) : 0
  const visibleTags = (group.tags ?? []).slice(0, 2)

  function open(e) {
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: group.id } }))
  }

  return (
    <article
      className="card flex cursor-pointer flex-col gap-2.5 p-4 transition-shadow hover:shadow-md"
      onClick={open}
    >
      {/* Service info row */}
      <div className="flex items-center gap-2.5">
        <ServiceLogo serviceId={group.serviceId} size={36} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-extrabold text-ink">{group.serviceName}</span>
            <span className="shrink-0 rounded-md bg-raised px-1.5 py-0.5 text-[11px] font-bold text-ink-3">
              {group.planName}
            </span>
          </div>
        </div>
      </div>

      {/* Price */}
      <p className="text-base font-extrabold text-ink">
        NT${group.billingCycle === 'yearly' ? group.pricePerSeat * 12 : group.pricePerSeat}
        <span className="ml-1 text-xs font-normal text-ink-3">{group.billingCycle === 'yearly' ? '/年' : '/每月'}</span>
      </p>

      {/* Seats */}
      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${usedRatio * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-ink-4">{group.openSeats} 席 / 總名額 {group.totalSeats} 席</p>
      </div>

      {/* Tags + 查看 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
          {visibleTags.map(tag => <TagChip key={tag} label={tag} size="sm" />)}
        </div>
        <button
          className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors hover:border-brand hover:text-brand"
        >
          查看
        </button>
      </div>
    </article>
  )
}

// ─── Main modal ────────────────────────────────────────────────────────────────

export default function GroupDetailModal() {
  const navigate = useNavigate()
  const [groupId, setGroupId]               = useState(null)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [applied, setApplied]               = useState(false)
  const [isFav, setIsFav]                   = useState(false)
  const [recPage, setRecPage]               = useState(0)
  const [openSections, setOpenSections]     = useState(() => new Set(['service']))

  const summaryRef = useRef(null)
  const leftColRef = useRef(null)

  const isOpen = !!groupId
  useScrollLock(isOpen)

  const activeUser   = getActiveUser()
  const activeUserId = activeUser?.id

  useEffect(() => {
    function onOpen(e) {
      const gId = e.detail?.groupId ?? null
      setGroupId(gId)
      setRecPage(0)
      setApplyModalOpen(false)
      setOpenSections(new Set(['service']))
      if (leftColRef.current) leftColRef.current.scrollTop = 0
      if (gId && activeUserId) {
        setApplied(!!getApplicationByUserAndGroup(activeUserId, gId))
        setIsFav(isGroupFavorited(activeUserId, gId))
      } else {
        setApplied(false)
        setIsFav(false)
      }
    }
    window.addEventListener('pm:open-group', onOpen)
    return () => window.removeEventListener('pm:open-group', onOpen)
  }, [activeUserId])

  useEffect(() => {
    if (!isOpen) return
    function onEsc(e) { if (e.key === 'Escape') setGroupId(null) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [isOpen])

  useLayoutEffect(() => {
    if (!isOpen) return
    const syncHeight = () => {
      const summary = summaryRef.current
      const left    = leftColRef.current
      if (!summary || !left) return
      if (window.innerWidth >= 1024) {
        left.style.height = summary.offsetHeight + 'px'
      } else {
        left.style.height = ''
      }
    }
    syncHeight()
    const ro = new ResizeObserver(syncHeight)
    if (summaryRef.current) ro.observe(summaryRef.current)
    return () => { ro.disconnect() }
  }, [isOpen, groupId])

  const group   = isOpen ? getGroupById(groupId) : null
  const service = group ? getServiceById(group.serviceId) : null
  const plan    = service?.plans.find(p => p.name === group?.planName)

  const picks = useMemo(() => {
    if (!group) return []
    const recruiting = getGroups().filter(g => g.status === 'recruiting' && g.openSeats > 0 && g.id !== group.id)
    return [
      ...recruiting.filter(g => g.serviceId === group.serviceId),
      ...recruiting.filter(g => g.serviceId !== group.serviceId),
    ]
  }, [groupId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !group) return null

  const allRules = [
    ...(group.requirements ? [group.requirements] : []),
    ...(group.rules ?? []),
  ]

  const isHost           = group?.hostId === activeUserId
  const isMember         = group ? isCurrentUserMember(group.id) : false
  const memberRecord     = activeUserId && group ? getMemberByUserAndGroup(activeUserId, group.id) : null
  const isPendingPayment = isMember && memberRecord?.paymentStatus === 'pending'
  const isMarkedPaid     = isMember && memberRecord?.paymentStatus === 'markedPaid'
  const isFull           = (group?.openSeats ?? 0) <= 0
  const canApply         = !isHost && !isMember && !applied && !isFull && !!activeUserId

  function renderCTA() {
    if (!activeUserId) return (
      <Button variant="primary" size="lg" className="w-full"
        onClick={() => navigate(`/login?redirectTo=/groups/${group.id}`)}>
        <LogIn size={16} />登入以加入群組
      </Button>
    )
    if (isHost) return (
      <div className="flex items-center gap-2 rounded-xl bg-brand-subtle px-4 py-3 text-sm font-medium text-brand">
        <ShieldCheck size={15} />你是此群組的團主
      </div>
    )
    if (isPendingPayment) return (
      <div className="flex items-center gap-2 rounded-xl bg-warning-subtle px-4 py-3 text-sm font-medium text-warning-text">
        <CreditCard size={15} />已加入，請前往「我的訂閱」完成付款
      </div>
    )
    if (isMarkedPaid) return (
      <div className="flex items-center gap-2 rounded-xl bg-purple-subtle px-4 py-3 text-sm font-medium text-purple-text">
        <CheckCircle2 size={15} />已標記付款，等待團主確認
      </div>
    )
    if (isMember) return (
      <div className="flex items-center gap-2 rounded-xl bg-success-subtle px-4 py-3 text-sm font-medium text-success-text">
        <CheckCircle2 size={15} />已加入此群組
      </div>
    )
    if (isFull) return (
      <Button variant="ghost" size="lg" className="w-full border border-line" disabled>已額滿</Button>
    )
    if (applied) return (
      <div className="flex items-center gap-2 rounded-xl bg-warning-subtle px-4 py-3 text-sm font-medium text-warning-text">
        <CheckCircle2 size={15} />已送出申請，等待團主審核
      </div>
    )
    return (
      <Button
        size="lg"
        className="w-full bg-[#1a1f36] text-white hover:bg-[#252b47]"
        onClick={() => setApplyModalOpen(true)}
      >
        申請加入 <ChevronRight size={16} />
      </Button>
    )
  }

  const totalSlides = Math.max(1, Math.ceil(picks.length / 3))

  const planChips = group ? [
    { icon: Calendar, label: '方案',      value: group.planName },
    { icon: Users,    label: '共享方式',  value: `${group.totalSeats} 人共享` },
    ...(plan?.features?.length > 0
      ? [{ icon: Play, label: '主要功能', value: plan.features[0] }]
      : []),
  ] : []

  const infoRows = group ? [
    ...(group.requirements ? [{ label: '帳號需求', value: group.requirements }] : []),
    { label: '群組狀態', value: STATUS_LABELS[group.status] ?? group.status },
    { label: '建立時間', value: group.createdAt?.slice(0, 10).replace(/-/g, '/') ?? '—' },
  ] : []

  const hostStars = group?.hostRating != null ? Math.round(group.hostRating / 20) : 0

  // ── Render ──
  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={() => setGroupId(null)} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-center justify-center p-4 md:p-8">
        <div
          className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl md:max-w-5xl"
          style={{ height: 'min(92vh, 860px)' }}
        >
          {/* ── Header ── */}
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5 lg:px-8">
            {group ? (
              <div className="flex items-center gap-2.5">
                <ServiceLogo serviceId={group.serviceId} size={28} className="rounded-lg" />
                <span className="text-lg font-extrabold text-ink">{group.serviceName}</span>
              </div>
            ) : (
              <span className="text-lg font-extrabold text-ink">群組詳情</span>
            )}
            <button
              onClick={() => setGroupId(null)}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!group ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-3">
                <AlertCircle size={40} className="text-ink-4" />
                <p className="font-semibold">找不到此群組</p>
              </div>
            ) : (
              <>
                {/* Two-column layout */}
                <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:gap-6 lg:p-8">

                  {/* ────────── LEFT COLUMN ────────── */}
                  <div ref={leftColRef} className="order-2 min-w-0 flex-1 overflow-y-auto lg:order-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                    {/* Desktop: all sections always visible */}
                    <div className="hidden divide-y divide-line-subtle lg:block">

                      {/* 服務介紹 */}
                      <div className="space-y-4 py-5">
                        <p className="text-sm font-semibold text-ink">服務介紹</p>
                        {service?.description && (
                          <p className="text-sm leading-relaxed text-ink-2">{service.description}</p>
                        )}
                        {planChips.length > 0 && (
                          <div className={`grid gap-2 ${planChips.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {planChips.map(({ icon: Icon, label: chipLabel, value }) => (
                              <div key={chipLabel} className="flex flex-col gap-1 rounded-xl border border-line bg-canvas p-3">
                                <Icon size={14} className="text-ink-3" />
                                <span className="text-xs text-ink-4">{chipLabel}</span>
                                <span className="text-xs font-bold leading-snug text-ink">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {(plan?.description || (plan?.features?.length ?? 0) > 0) && (
                          <div className="border-t border-line-subtle pt-4">
                            {plan?.description && (
                              <p className="mb-3 text-sm font-medium text-ink-2">{plan.description}</p>
                            )}
                            {(plan?.features ?? []).length > 0 && (
                              <ul className="space-y-2">
                                {plan.features.map((feat, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand" />
                                    {feat}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 加入條件與規則 */}
                      <div className="py-5">
                        <p className="mb-3 text-sm font-semibold text-ink">加入條件與規則</p>

                        {allRules.length > 0 ? (
                          <ul className="space-y-3">
                            {allRules.map((rule, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                                <span>{rule}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-ink-4">此群組尚未設定加入規則</p>
                        )}
                      </div>

                      {/* 團主評價 */}
                      <div className="space-y-4 py-5">
                        <p className="text-sm font-semibold text-ink">團主評價</p>
                        <div className="flex items-center gap-3 border-b border-line-subtle pb-4">
                          <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star key={i} size={12} className={i < hostStars ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                                ))}
                              </div>
                              {(group.hostReviewCount ?? 0) > 0 && (
                                <span className="text-xs text-ink-4">{group.hostReviewCount} 則評價</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {(group.reviews ?? []).length === 0 ? (
                          <p className="py-4 text-center text-sm text-ink-4">尚無評價</p>
                        ) : (
                          (group.reviews ?? []).map(review => (
                            <div key={review.id} className="flex gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold text-ink-2">
                                {review.author?.[0] ?? '?'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-semibold text-ink">{review.author}</span>
                                  <span className="text-xs text-ink-4">{review.date}</span>
                                </div>
                                {review.rating != null && (
                                  <div className="mb-1 flex gap-0.5">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star key={i} size={11} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                                    ))}
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed text-ink-3">{review.comment}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>

                    {/* Mobile: accordion */}
                    <div className="divide-y divide-line-subtle lg:hidden">

                      {[
                        { key: 'service', label: '服務介紹' },
                        { key: 'rules',   label: '加入條件與規則' },
                        { key: 'reviews', label: '團主評價' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <button
                            className="flex w-full items-center justify-between px-6 py-4"
                            onClick={() => setOpenSections(prev => {
                              const next = new Set(prev)
                              next.has(key) ? next.delete(key) : next.add(key)
                              return next
                            })}
                          >
                            <span className="text-sm font-semibold text-ink">{label}</span>
                            <ChevronDown
                              size={16}
                              className={`shrink-0 text-ink-3 transition-transform duration-200 ${openSections.has(key) ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {openSections.has(key) && key === 'service' && (
                            <div className="space-y-4 px-6 pb-5">
                              {service?.description && (
                                <p className="text-sm leading-relaxed text-ink-2">{service.description}</p>
                              )}
                              {planChips.length > 0 && (
                                <div className={`grid gap-2 ${planChips.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                  {planChips.map(({ icon: Icon, label: chipLabel, value }) => (
                                    <div key={chipLabel} className="flex flex-col gap-1 rounded-xl border border-line bg-canvas p-3">
                                      <Icon size={14} className="text-ink-3" />
                                      <span className="text-xs text-ink-4">{chipLabel}</span>
                                      <span className="text-xs font-bold leading-snug text-ink">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {(plan?.description || (plan?.features?.length ?? 0) > 0) && (
                                <div className="border-t border-line-subtle pt-4">
                                  {plan?.description && (
                                    <p className="mb-3 text-sm font-medium text-ink-2">{plan.description}</p>
                                  )}
                                  {(plan?.features ?? []).length > 0 && (
                                    <ul className="space-y-2">
                                      {plan.features.map((feat, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                                          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand" />
                                          {feat}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {openSections.has(key) && key === 'rules' && (
                            <div className="px-6 pb-5">
                              {allRules.length > 0 ? (
                                <ul className="space-y-3">
                                  {allRules.map((rule, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                                      <span>{rule}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-ink-4">此群組尚未設定加入規則</p>
                              )}
                            </div>
                          )}

                          {openSections.has(key) && key === 'reviews' && (
                            <div className="space-y-4 px-6 pb-5">
                              <div className="flex items-center gap-3 border-b border-line-subtle pb-4">
                                <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Star key={i} size={12} className={i < hostStars ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                                      ))}
                                    </div>
                                    {(group.hostReviewCount ?? 0) > 0 && (
                                      <span className="text-xs text-ink-4">{group.hostReviewCount} 則評價</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {(group.reviews ?? []).length === 0 ? (
                                <p className="py-4 text-center text-sm text-ink-4">尚無評價</p>
                              ) : (
                                (group.reviews ?? []).map(review => (
                                  <div key={review.id} className="flex gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold text-ink-2">
                                      {review.author?.[0] ?? '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-ink">{review.author}</span>
                                        <span className="text-xs text-ink-4">{review.date}</span>
                                      </div>
                                      {review.rating != null && (
                                        <div className="mb-1 flex gap-0.5">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star key={i} size={11} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                                          ))}
                                        </div>
                                      )}
                                      <p className="text-sm leading-relaxed text-ink-3">{review.comment}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                    </div>
                  </div>
                  {/* ────────── END LEFT ────────── */}

                  {/* ────────── RIGHT COLUMN ────────── */}
                  <div ref={summaryRef} className="order-1 lg:order-2 lg:w-[20rem] lg:shrink-0">

                    {/* Summary card */}
                    <div className="card divide-y divide-line-subtle overflow-hidden">

                      {/* Price + heart */}
                      <div className="flex items-start justify-between px-6 py-4 lg:px-8">
                        <div>
                          <p className="mb-0.5 text-xs font-medium text-ink-4">每席價格</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
                            <span className="text-sm text-ink-3">/每月</span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            activeUserId
                              ? setIsFav(toggleFavorite(activeUserId, group.id))
                              : navigate(`/login?redirectTo=/groups/${group.id}`)
                          }
                          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-raised"
                          aria-label={isFav ? '取消收藏' : '加入收藏'}
                        >
                          <Heart size={19} className={isFav ? 'fill-red-500 text-red-500' : 'text-ink-4'} />
                        </button>
                      </div>

                      {/* Seats */}
                      <div className="px-6 py-4 lg:px-8">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-ink-3">剩餘名額</span>
                          <span className="font-semibold text-ink">
                            {group.openSeats} 席 / 總名額 {group.totalSeats} 席
                          </span>
                        </div>
                        <ProgressBar value={group.usedSeats} max={group.totalSeats} />
                        <div className="mt-1.5 flex justify-between text-xs text-ink-4">
                          <span>已佔 {group.usedSeats} 人</span>
                          <span>共 {group.totalSeats} 人</span>
                        </div>
                      </div>

                      {/* Tag chips */}
                      {(group.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 px-6 py-4 lg:px-8">
                          {(group.tags ?? []).map(tag => <TagChip key={tag} label={tag} />)}
                        </div>
                      )}

                      {/* Info table */}
                      {infoRows.length > 0 && (
                        <div className="px-6 py-4 lg:px-8">
                          <div className="space-y-2">
                            {infoRows.map(({ label, value }) => (
                              <div key={label} className="flex gap-3 text-sm">
                                <span className="w-14 shrink-0 text-ink-4">{label}</span>
                                <span className="flex-1 text-ink-2">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CTA — desktop only; mobile uses sticky footer bar */}
                      <div className="hidden px-6 py-4 lg:block lg:px-8">
                        {activeUserId && !isHost && (
                          <button
                            onClick={() => {
                              setGroupId(null)
                              window.dispatchEvent(new CustomEvent('pm:open-dm', { detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor } }))
                            }}
                            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-brand hover:text-brand"
                          >
                            聯絡團主
                            <MessageCircle size={15} />
                          </button>
                        )}
                        {renderCTA()}
                        {canApply && (
                          <p className="mt-2 text-center text-xs text-ink-4">
                            申請後需經團主審核，通過後即可加入群組
                          </p>
                        )}
                        {group.openSeats <= 2 && !isFull && canApply && (
                          <p className="mt-1 text-center text-xs text-warning-text">
                            僅剩 {group.openSeats} 個名額
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                  {/* ────────── END RIGHT ────────── */}

                </div>

                {/* ────────── RECOMMENDATIONS (full-width) ────────── */}
                {picks.length > 0 && (
                  <div className="border-t border-line px-8 pb-6 pt-5 lg:pb-8">
                    <h3 className="mb-4 text-sm font-bold text-ink">其他推薦群組</h3>

                    {/* Mobile: horizontal scroll */}
                    <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
                      {picks.map(g => (
                        <div key={g.id} className="w-56 shrink-0">
                          <GroupRecommendCard group={g} />
                        </div>
                      ))}
                    </div>

                    {/* Desktop: 3-per-slide carousel */}
                    <div className="hidden lg:block">
                      <div className="flex items-center gap-2">
                        {totalSlides > 1 && (
                          <button
                            onClick={() => setRecPage(p => Math.max(0, p - 1))}
                            disabled={recPage === 0}
                            className="shrink-0 grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-sm transition-colors hover:bg-raised disabled:opacity-0"
                          >
                            <ChevronLeft size={16} />
                          </button>
                        )}

                        <div className="min-w-0 flex-1 overflow-hidden p-0.5">
                          <div
                            className="flex transition-transform duration-300 ease-in-out"
                            style={{
                              width: `${totalSlides * 100}%`,
                              transform: `translateX(-${recPage * (100 / totalSlides)}%)`,
                            }}
                          >
                            {Array.from({ length: totalSlides }).map((_, si) => (
                              <div key={si} style={{ width: `${100 / totalSlides}%` }}>
                                <div className="grid grid-cols-3 gap-3">
                                  {picks.slice(si * 3, si * 3 + 3).map(g => (
                                    <GroupRecommendCard key={g.id} group={g} />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {totalSlides > 1 && (
                          <button
                            onClick={() => setRecPage(p => Math.min(totalSlides - 1, p + 1))}
                            disabled={recPage === totalSlides - 1}
                            className="shrink-0 grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-sm transition-colors hover:bg-raised disabled:opacity-0"
                          >
                            <ChevronRight size={16} />
                          </button>
                        )}
                      </div>

                      {/* Dot indicators */}
                      {totalSlides > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                          {Array.from({ length: totalSlides }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setRecPage(i)}
                              className={`h-2 rounded-full transition-all ${
                                i === recPage ? 'w-5 bg-ink' : 'w-2 bg-line hover:bg-ink-4'
                              }`}
                              aria-label={`第 ${i + 1} 頁`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </>
            )}
          </div>

          {/* Mobile sticky CTA */}
          <div className="shrink-0 border-t border-line bg-canvas px-6 py-3 lg:hidden">
            {group && activeUserId && !isHost && (
              <button
                onClick={() => {
                  setGroupId(null)
                  window.dispatchEvent(new CustomEvent('pm:open-dm', { detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor } }))
                }}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-brand hover:text-brand"
              >
                聯絡團主
                <MessageCircle size={15} />
              </button>
            )}
            {group && renderCTA()}
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {group && (
        <ApplyJoinModal
          group={group}
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          onSuccess={() => { setApplied(true); setApplyModalOpen(false) }}
        />
      )}
    </>,
    document.body,
  )
}
