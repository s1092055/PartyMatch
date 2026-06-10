import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Heart,
  LogIn, MessageSquare, ShieldCheck, Users, X,
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
import CreditScoreBadge from '../../shared/components/ui/CreditScoreBadge'
import ProgressBar from '../../shared/components/ui/ProgressBar'
import SectionCard from '../../shared/components/ui/SectionCard'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import ApplyJoinModal from './components/ApplyJoinModal'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'

const PREVIEW_COUNT = 3

export default function GroupDetailModal() {
  const navigate = useNavigate()
  const [groupId, setGroupId] = useState(null)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [applied, setApplied] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [recPage, setRecPage] = useState(0)

  const isOpen = !!groupId
  useScrollLock(isOpen)

  const activeUser = getActiveUser()
  const activeUserId = activeUser?.id

  useEffect(() => {
    function onOpen(e) {
      const gId = e.detail?.groupId ?? null
      setGroupId(gId)
      setShowAllReviews(false)
      setRecPage(0)
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

  if (!isOpen) return null

  const group = getGroupById(groupId)
  const service = group ? getServiceById(group.serviceId) : null
  const plan = service?.plans.find(p => p.name === group?.planName)

  const isHost = group?.hostId === activeUserId
  const isMember = group ? isCurrentUserMember(group.id) : false
  const memberRecord = activeUserId && group ? getMemberByUserAndGroup(activeUserId, group.id) : null
  const isPendingPayment = isMember && memberRecord?.paymentStatus === 'pending'
  const isMarkedPaid = isMember && memberRecord?.paymentStatus === 'markedPaid'
  const isFull = (group?.openSeats ?? 0) <= 0

  function renderCTA() {
    if (!activeUserId) {
      return (
        <Button variant="primary" size="lg" className="w-full"
          onClick={() => navigate(`/login?redirectTo=/groups/${group.id}`)}>
          <LogIn size={16} />登入以加入群組
        </Button>
      )
    }
    if (isHost) return (
      <div className="flex items-center gap-2 rounded-lg bg-brand-subtle px-4 py-3 text-sm font-medium text-brand">
        <ShieldCheck size={16} />你是此群組的團主
      </div>
    )
    if (isPendingPayment) return (
      <div className="flex items-center gap-2 rounded-lg bg-warning-subtle px-4 py-3 text-sm font-medium text-warning-text">
        <CreditCard size={16} />已加入，請前往「我的訂閱」完成付款
      </div>
    )
    if (isMarkedPaid) return (
      <div className="flex items-center gap-2 rounded-lg bg-purple-subtle px-4 py-3 text-sm font-medium text-purple-text">
        <CheckCircle2 size={16} />已標記付款，等待團主確認
      </div>
    )
    if (isMember) return (
      <div className="flex items-center gap-2 rounded-lg bg-success-subtle px-4 py-3 text-sm font-medium text-success-text">
        <CheckCircle2 size={16} />已加入此群組
      </div>
    )
    if (isFull) return (
      <Button variant="ghost" size="lg" className="w-full border border-line" disabled>已額滿</Button>
    )
    if (applied) return (
      <div className="flex items-center gap-2 rounded-lg bg-warning-subtle px-4 py-3 text-sm font-medium text-warning-text">
        <CheckCircle2 size={16} />已送出申請，等待團主審核
      </div>
    )
    return (
      <Button variant="primary" size="lg" className="w-full" onClick={() => setApplyModalOpen(true)}>
        申請加入<ChevronRight size={16} />
      </Button>
    )
  }

  function renderHostCredit() {
    return (
      <>
        <div className="mb-4 flex items-center gap-3 border-b border-line-subtle pb-4">
          <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-ink">{group.hostName}</span>
            <div className="mt-0.5"><CreditScoreBadge score={group.hostRating} /></div>
          </div>
        </div>
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
      </>
    )
  }

  function renderRecommendations() {
    const allRecruiting = getGroups().filter(
      g => g.status === 'recruiting' && g.openSeats > 0 && g.id !== group.id
    )
    const sameService = allRecruiting.filter(g => g.serviceId === group.serviceId)
    const others = allRecruiting.filter(g => g.serviceId !== group.serviceId)
    const picks = [...sameService, ...others]
    if (picks.length === 0) return null

    const pageSize = 2
    const totalPages = Math.ceil(picks.length / pageSize)
    const safePage = Math.min(recPage, totalPages - 1)

    return (
      <div className="relative">
        {/* Slide track */}
        <div className="overflow-hidden">
          <div
            className="flex gap-4 transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(calc(-${safePage} * (50% + 8px)))` }}
          >
            {picks.map(g => (
              <div key={g.id} className="w-[calc(50%-8px)] shrink-0">
                <ExploreGroupCard group={g} />
              </div>
            ))}
          </div>
        </div>

        {/* Arrows */}
        {totalPages > 1 && (
          <>
            <button
              onClick={() => setRecPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="absolute -left-4 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink-3 shadow-sm transition-colors hover:bg-raised disabled:opacity-0"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setRecPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage === totalPages - 1}
              className="absolute -right-4 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink-3 shadow-sm transition-colors hover:bg-raised disabled:opacity-0"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

      </div>
    )
  }

  function renderSectionContent(key) {
    if (key === 'service') {
      return service?.description
        ? <p className="text-sm leading-relaxed text-ink-2">{service.description}</p>
        : <p className="text-sm text-ink-4">暫無服務介紹</p>
    }
    if (key === 'plan') {
      const allPoints = [
        ...(plan?.description ? [{ text: plan.description, highlight: true }] : []),
        ...(plan?.features ?? []).map(f => ({ text: f, highlight: false })),
      ]
      return (
        <>
          {allPoints.length > 0 && (
            <ul className="space-y-2.5">
              {allPoints.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2
                    size={15}
                    className={`mt-0.5 shrink-0 ${item.highlight ? 'text-ink-3' : 'text-brand'}`}
                  />
                  <span className={item.highlight ? 'text-ink-3' : 'text-ink-2'}>{item.text}</span>
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
                    <span className="shrink-0 text-sm font-bold text-ink-3">
                      NT${p.monthlyPrice}<span className="text-xs font-normal">/月</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )
    }
    if (key === 'rules') {
      return (
        <>
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
        </>
      )
    }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={() => setGroupId(null)} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-end justify-center md:items-center md:p-8">
        <div className="pointer-events-auto relative flex h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-canvas shadow-2xl md:max-w-5xl md:rounded-2xl lg:h-auto">

          {/* Floating close button */}
          <button
            onClick={() => setGroupId(null)}
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-ink-3 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-ink"
            aria-label="關閉"
          >
            <X size={18} />
          </button>

          {/* Content — mobile: single scroll; desktop: two independent columns */}
          <div className="flex-1 min-h-0 overflow-y-auto lg:flex-none lg:overflow-visible">
            {!group ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-3">
                <AlertCircle size={40} className="text-ink-4" />
                <p className="font-semibold">找不到此群組</p>
              </div>
            ) : (
              <div className="lg:flex lg:items-start">

                {/* Left column — merged hero + summary card */}
                <div className="p-4 md:p-5 lg:w-[22rem] lg:shrink-0 lg:border-r lg:border-line">
                  <div className="card overflow-hidden">
                    {/* Hero */}
                    <div className="flex items-start gap-4 border-b border-line-subtle px-5 pb-4 pt-5">
                      <ServiceLogo serviceId={group.serviceId} size={60} />
                      <div className="min-w-0 flex-1 pr-10">
                        <h2 className="text-xl font-extrabold text-ink">{group.serviceName}</h2>
                        <p className="mt-0.5 text-sm text-ink-3">{group.planName}</p>
                      </div>
                    </div>

                    {/* Price + Favorite */}
                    <div className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
                      <div>
                        <p className="mb-0.5 text-xs font-semibold text-ink-4">每席價格</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-brand">NT${group.pricePerSeat}</span>
                          <span className="text-sm font-bold text-ink-2">/ 每月</span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          activeUserId
                            ? setIsFav(toggleFavorite(activeUserId, group.id))
                            : navigate(`/login?redirectTo=/groups/${group.id}`)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-raised"
                        aria-label={isFav ? '取消收藏' : '加入收藏'}
                      >
                        <Heart size={20} className={isFav ? 'fill-red-500 text-red-500' : 'text-ink-4'} />
                      </button>
                    </div>

                    {/* Seats */}
                    <div className="border-b border-line-subtle px-5 py-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-ink-2">
                          <Users size={14} />
                          <span>剩餘名額</span>
                        </div>
                        <span className="text-sm font-semibold text-ink">
                          {group.openSeats} 席 / 總名額 {group.totalSeats} 席
                        </span>
                      </div>
                      <ProgressBar value={group.usedSeats} max={group.totalSeats} />
                      <div className="mt-1 flex justify-between">
                        <span className="text-xs text-ink-4">已佔 {group.usedSeats} 人</span>
                        <span className="text-xs text-ink-4">共 {group.totalSeats} 人</span>
                      </div>
                    </div>

                    {/* CTA — desktop only (mobile uses sticky bar) */}
                    <div className="hidden px-5 py-4 lg:block">
                      {renderCTA()}
                      {group.openSeats <= 2 && !isFull && !isMember && !applied && !isHost && (
                        <p className="mt-2 text-center text-xs text-warning-text">
                          僅剩 {group.openSeats} 個名額
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column — desktop only, independent scroll */}
                <div className="hidden lg:flex lg:max-h-[80vh] lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-2 lg:overflow-y-auto lg:px-8 lg:py-6">
                  {service?.description && (
                    <SectionCard title="服務介紹" flat>
                      <p className="text-sm leading-relaxed text-ink-2">{service.description}</p>
                    </SectionCard>
                  )}
                  {(plan?.features?.length > 0 || plan?.description || service?.plans?.length > 1) && (
                    <SectionCard title="方案說明" subtitle={group.planName} flat>
                      {renderSectionContent('plan')}
                    </SectionCard>
                  )}
                  <SectionCard title="加入條件與規則" subtitle="加入前請仔細閱讀" flat>
                    {renderSectionContent('rules')}
                  </SectionCard>
                  <SectionCard
                    title="團主信用"
                    subtitle={`${group.hostReviewCount} 則評價`}
                    action={<CreditScoreBadge score={group.hostRating} size="md" />}
                    flat
                  >
                    {renderHostCredit()}
                  </SectionCard>
                  {(() => { const r = renderRecommendations(); return r && <SectionCard title="其他推薦" flat>{r}</SectionCard> })()}
                </div>

                {/* Mobile linear sections */}
                <div className="flex flex-col gap-4 p-4 md:p-5 lg:hidden">
                  {service?.description && (
                    <SectionCard title="服務介紹">
                      <p className="text-sm leading-relaxed text-ink-2">{service.description}</p>
                    </SectionCard>
                  )}
                  {(plan?.features?.length > 0 || plan?.description || service?.plans?.length > 1) && (
                    <SectionCard title="方案說明" subtitle={group.planName}>
                      {renderSectionContent('plan')}
                    </SectionCard>
                  )}
                  <SectionCard title="加入條件與規則" subtitle="加入前請仔細閱讀">
                    {renderSectionContent('rules')}
                  </SectionCard>
                  <SectionCard
                    title="團主信用"
                    subtitle={`${group.hostReviewCount} 則評價`}
                    action={<CreditScoreBadge score={group.hostRating} size="md" />}
                  >
                    {renderHostCredit()}
                  </SectionCard>
                </div>

              </div>
            )}
          </div>

          {/* Mobile sticky CTA bar */}
          <div className="shrink-0 border-t border-line bg-white px-4 py-3 lg:hidden">
            {group && renderCTA()}
          </div>
        </div>
      </div>

      {group && (
        <ApplyJoinModal
          group={group}
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          onSuccess={() => { setApplied(true); setApplyModalOpen(false) }}
        />
      )}
    </>,
    document.body
  )
}
