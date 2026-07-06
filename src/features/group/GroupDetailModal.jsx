import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, ChevronRight,
  Heart, LogIn, LogOut, MessageCircle, Shield, ShieldCheck, Star, Users,
} from 'lucide-react'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import { useApplicationStore } from '../../shared/stores/useApplicationStore'
import { useMemberStore } from '../../shared/stores/useMemberStore'
import { useFavoriteStore } from '../../shared/stores/useFavoriteStore'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { finalizeLeaveGroup } from './utils/leaveGroupFlow'
import { toast } from '../../shared/utils/toast'
import Avatar from '../../shared/ui/Avatar'
import Button from '../../shared/ui/Button'
import CountdownConfirmDialog from '../../shared/ui/CountdownConfirmDialog'
import GroupModalShell from '../../shared/ui/GroupModalShell'
import ServiceLogo from '../../shared/ui/ServiceLogo'
import TokenAmount from '../../shared/ui/TokenAmount'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'

// ── 團主評價 ──────────────────────────────────────────────────────────────────

function HostReviews({ group, hostStars, headerClassName, onDm }) {
  return (
    <div className="space-y-4 py-5">
      <p className={headerClassName}>團主評價</p>
      <div className="flex items-center gap-3 border-b border-line-subtle pb-4">
        <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{group.hostName}（團主）</p>
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
        {onDm && (
          <button
            onClick={onDm}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-brand hover:text-brand"
            aria-label="聯絡團主"
          >
            <MessageCircle size={16} />
          </button>
        )}
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
  )
}

// ── 主元件 ────────────────────────────────────────────────────────────────────

export default function GroupDetailModal() {
  const navigate = useNavigate()
  const [groupId, setGroupId]               = useState(null)
  const [showApply, setShowApply]           = useState(false)
  const [applyMessage, setApplyMessage]     = useState('')
  const [applyAgreed, setApplyAgreed]       = useState(false)
  const [applySubmitted, setApplySubmitted] = useState(false)
  const [showMembers, setShowMembers]           = useState(false)
  const [leaveConfirm, setLeaveConfirm]         = useState(false)
  const [withdrawConfirm, setWithdrawConfirm]   = useState(false)
  const [withdrawing, setWithdrawing]           = useState(false)

  const isOpen       = !!groupId
  const activeUser   = useAuthStore(s => s.user)
  const activeUserId = activeUser?.id

  // 訂閱 store 切片，群組/申請/成員/收藏更新時自動重新渲染
  const groups       = useGroupStore(s => s.groups)
  const applications = useApplicationStore(s => s.applications)
  const members      = useMemberStore(s => s.members)
  const isFav        = useFavoriteStore(s => groupId && activeUserId ? s.isFavorited(activeUserId, groupId) : false)

  function resetApply() {
    setShowApply(false); setApplyMessage(''); setApplyAgreed(false); setApplySubmitted(false)
  }

  useEffect(() => {
    function onOpen(e) {
      setGroupId(e.detail?.groupId ?? null)
      resetApply()
    }
    window.addEventListener('pm:open-group', onOpen)
    return () => window.removeEventListener('pm:open-group', onOpen)
  }, [])

  const group   = isOpen ? (groups.find(g => g.id === groupId) ?? null) : null
  const service = group ? getServiceById(group.serviceId) : null
  const plan    = service?.plans.find(p => p.name === group?.planName)

  const picks = useMemo(() => {
    if (!group) return []
    const recruiting = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0 && g.id !== group.id && g.hostId !== activeUserId)
    return [
      ...recruiting.filter(g => g.serviceId === group.serviceId),
      ...recruiting.filter(g => g.serviceId !== group.serviceId),
    ]
  }, [group, groups, activeUserId])

  const memberGroupIds  = useMemo(
    () => new Set(members.filter(m => m.userId === activeUserId).map(m => m.groupId)),
    [members, activeUserId],
  )
  const appliedGroupIds = useMemo(
    () => activeUserId
      ? new Set(applications.filter(a => (a.applicantId ?? a.userId) === activeUserId && a.status === 'pending').map(a => a.groupId))
      : new Set(),
    [applications, activeUserId],
  )

  if (!isOpen || !group) return null

  const isHost           = group.hostId === activeUserId
  const isMember         = activeUserId ? members.some(m => m.userId === activeUserId && m.groupId === group.id) : false
  const memberRecord     = activeUserId ? (members.find(m => m.userId === activeUserId && m.groupId === group.id) ?? null) : null
  const isPaymentPhase      = ['pending_confirmation', 'pending_activation', 'active'].includes(group.status)
  const hasServiceInfoIssue = !!memberRecord?.serviceInfoIssueNote
  const hasServiceInfo      = !!memberRecord?.serviceInfo?.email && !hasServiceInfoIssue
  const needsFillInfo       = isMember && isPaymentPhase && !hasServiceInfo
  const isWaitingMembers = isMember && ['recruiting', 'full'].includes(group.status)
  const isFull           = (group.openSeats ?? 0) <= 0

  // 直接從 store 讀取申請狀態，避免 state 在審核過渡期間不一致
  // approved && !isMember → false，確保退出後可重新申請
  const app          = activeUserId ? useApplicationStore.getState().getByUserAndGroup(activeUserId, group.id) : null
  const appStatus    = app?.status
  const hasActiveApp = !!app && appStatus !== 'rejected' && appStatus !== 'removed' && appStatus !== 'left' && appStatus !== 'withdrawn' && !(appStatus === 'approved' && !isMember)
  const isPendingApp = appStatus === 'pending'

  const canApply = !isHost && !isMember && !hasActiveApp && !isFull && !!activeUserId

  function handleClose() { setGroupId(null); setShowMembers(false); setLeaveConfirm(false); setWithdrawConfirm(false); resetApply() }

  async function handleWithdraw() {
    if (withdrawing || !app) return
    setWithdrawing(true)
    try {
      await useApplicationStore.getState().withdraw(app.id)
      setWithdrawConfirm(false)
    } finally {
      setWithdrawing(false)
    }
  }

  async function handleApply() {
    if (!applyAgreed) return
    try {
      await useApplicationStore.getState().create({
        groupId: group.id,
        groupName: group.groupName || group.serviceName,
        serviceId: group.serviceId,
        serviceName: group.serviceName,
        planName: group.planName,
        hostId: group.hostId,
        hostName: group.hostName,
        hostAvatarInitial: group.hostAvatarInitial,
        hostAvatarColor: group.hostAvatarColor,
        message: applyMessage,
      }, useAuthStore.getState().getProfile())
      setApplySubmitted(true)
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? '申請失敗，請稍後再試'
      if (err?.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        toast(`代幣不足：${msg}，請前往帳號中心儲值`, 'error')
      } else {
        toast(msg, 'error')
      }
    }
  }

  function handleLeave() {
    setLeaveConfirm(false)
    handleClose()
    finalizeLeaveGroup(
      groupId,
      { id: activeUserId, name: activeUser?.name ?? activeUser?.displayName ?? '成員' },
    ).catch(console.error)
  }
  function openDm() {
    handleClose()
    window.dispatchEvent(new CustomEvent('pm:open-dm', {
      detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor },
    }))
  }
  function toggleFav() {
    if (activeUserId) useFavoriteStore.getState().toggle(activeUserId, group.id)
    else navigate(`/login?redirectTo=/groups/${group.id}`)
  }

  function renderCTA() {
    if (!activeUserId) return (
      <Button variant="primary" size="lg" className="w-full"
        onClick={() => navigate(`/login?redirectTo=/groups/${group.id}`)}>
        <LogIn size={16} />登入以加入群組
      </Button>
    )
    if (isHost) return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-subtle px-4 py-3 text-sm font-medium text-brand">
        <ShieldCheck size={15} />你是此群組的團主
      </div>
    )
    if (isWaitingMembers) return null
    if (needsFillInfo) return (
      <div className="flex justify-center">
        <div className="relative w-full">
          <span className={`absolute inset-1 rounded-xl animate-ping opacity-20 ${hasServiceInfoIssue ? 'bg-danger' : 'bg-brand'}`} />
          <button
            onClick={() => {
              handleClose()
              navigate('/my-groups?view=member', { state: { openGroupId: group.id } })
            }}
            className={`relative flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors ${
              hasServiceInfoIssue ? 'bg-danger hover:opacity-90' : 'bg-brand hover:bg-brand-hover'
            }`}
          >
            {hasServiceInfoIssue ? '修正服務帳號' : '填寫服務帳號'}
          </button>
        </div>
      </div>
    )
    if (isMember) return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-success-subtle px-4 py-3 text-sm font-medium text-success-text">
        <CheckCircle2 size={15} />已加入此群組
      </div>
    )
    if (isPendingApp) return (
      withdrawConfirm ? (
        <div className="flex gap-2">
          <Button variant="ghost" size="lg" className="flex-1 border border-line" onClick={() => setWithdrawConfirm(false)}>返回</Button>
          <Button variant="danger" size="lg" className="flex-1" disabled={withdrawing} onClick={handleWithdraw}>
            {withdrawing ? '處理中…' : '確認取消'}
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="lg" className="w-full border border-line text-ink-3 hover:border-danger hover:text-danger"
          onClick={() => setWithdrawConfirm(true)}>
          取消申請
        </Button>
      )
    )
    if (isFull) return (
      <Button variant="ghost" size="lg" className="w-full border border-line" disabled>已額滿</Button>
    )
    return null
  }

  const hostStars = group.hostRating != null ? Math.round(group.hostRating / 20) : 0
  const reviews   = (
    <HostReviews
      group={group}
      hostStars={hostStars}
      headerClassName="text-lg font-black text-brand"
      onDm={activeUserId && !isHost ? openDm : undefined}
    />
  )

  return (
    <>
    <GroupModalShell
      onClose={handleClose}
      group={group}
      service={service}
      plan={plan}
      hideRecruitBar={isMember || isHost || group.status !== 'recruiting'}
      extraInfoRows={[]}
      statusBadgeOverride={isMember && group.status === 'recruiting' ? 'member_joined' : undefined}
      subPanel={showApply ? {
        title: '申請加入群組',
        content: (
          <div className="overflow-x-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ width: '200%', transform: applySubmitted ? 'translateX(-50%)' : 'translateX(0)' }}
            >
              {/* Panel 1：申請表單 */}
              <div className="w-1/2 min-w-0 flex flex-col gap-4 p-5">
                <div className="rounded-xl border border-line bg-raised/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ServiceLogo serviceId={group.serviceId} size={32} className="shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink truncate">{group.serviceName}</p>
                      <p className="text-xs text-ink-3">{group.planName}</p>
                    </div>
                    <p className="shrink-0 text-base font-extrabold text-brand">
                      <TokenAmount
                        amount={group.billingCycle === 'yearly' ? group.pricePerSeat * 12 : group.pricePerSeat}
                        cycle={group.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
                      />
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1.5">
                    申請備註<span className="ml-1 text-ink-4 font-normal">（選填）</span>
                  </label>
                  <textarea
                    value={applyMessage}
                    onChange={e => setApplyMessage(e.target.value)}
                    rows={3}
                    placeholder="可以介紹自己或說明申請原因…"
                    className="field w-full resize-none px-3 py-2.5 text-sm placeholder:text-ink-4"
                  />
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyAgreed}
                    onChange={e => setApplyAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-brand cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-ink-2">我已閱讀並同意此群組的所有規則與付款條件</span>
                </label>
                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" size="md" className="flex-1 border border-line" onClick={resetApply}>取消</Button>
                  <Button variant="primary" size="md" className="flex-1" disabled={!applyAgreed} onClick={handleApply}>送出申請</Button>
                </div>
              </div>
              {/* Panel 2：送出成功 */}
              <div className="w-1/2 min-w-0 flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-success-subtle flex items-center justify-center">
                  <CheckCircle2 size={26} className="text-success" />
                </div>
                <p className="text-base font-bold text-ink">申請已送出！</p>
                <p className="text-sm text-ink-3">等待團主審核後即可加入，請留意通知。</p>
                <Button
                  variant="primary" size="md" className="mt-2 min-w-[7rem]"
                  onClick={() => {
                    navigate('/my-groups?view=member', { state: { tab: 'processing' } })
                    window.dispatchEvent(new CustomEvent('pm:set-sub-tab', { detail: { tab: 'processing' } }))
                    handleClose()
                  }}
                >確認</Button>
              </div>
            </div>
          </div>
        ),
      } : showMembers ? {
        title: `成員名單（${members.filter(m => m.groupId === groupId && m.userId !== group.hostId).length + 1} 人）`,
        icon: <Users size={18} className="text-brand" />,
        content: (
          <div className="p-5 space-y-2">
            <div className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                      <Shield size={11} /> 團主
                    </span>
                  </div>
                  <p className="text-xs text-ink-3">{group.createdAt} 建立</p>
                </div>
                <button
                  onClick={() => { setShowMembers(false); openDm() }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
            </div>
            {members.filter(m => m.groupId === groupId && m.userId !== activeUserId).map(m => (
              <div key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ),
      } : null}
      onSubPanelBack={() => { setShowMembers(false); resetApply() }}
      headerBanner={
        isWaitingMembers ? (
          <div className="flex items-center justify-center gap-2 bg-success-subtle px-6 py-3 text-sm font-medium text-success-text">
            <CheckCircle2 size={15} />
            {group.status === 'full' ? '招募完成，等待團主啟用群組' : '已通過申請，需等待其他人加入'}
          </div>
        ) : isPendingApp ? (
          <div className="flex items-center justify-center gap-2 bg-warning-subtle px-6 py-3 text-sm font-medium text-warning-text">
            <CheckCircle2 size={15} />已送出申請，等待團主審核
          </div>
        ) : undefined
      }
      summaryFavoriteSlot={
        <button
          onClick={toggleFav}
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-raised"
          aria-label={isFav ? '取消收藏' : '加入收藏'}
        >
          <Heart size={19} className={isFav ? 'fill-red-500 text-red-500' : 'text-ink-4'} />
        </button>
      }
      mobileReviewsSection={reviews}
      mobileFooter={
        <div className="px-6 py-3">
          {isWaitingMembers ? (
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setShowMembers(true)}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
              >
                <Users size={17} /> 成員名單
              </button>
              <button
                onClick={() => setLeaveConfirm(true)}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-danger transition-colors hover:bg-red-50"
              >
                <LogOut size={17} /> 退出群組
              </button>
            </div>
          ) : isPendingApp ? (
            withdrawConfirm ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="lg" className="flex-1 border border-line" onClick={() => setWithdrawConfirm(false)}>返回</Button>
                <Button variant="danger" size="lg" className="flex-1" disabled={withdrawing} onClick={handleWithdraw}>
                  {withdrawing ? '處理中…' : '確認取消'}
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="lg" className="w-full border border-line text-ink-3 hover:border-danger hover:text-danger"
                onClick={() => setWithdrawConfirm(true)}>
                取消申請
              </Button>
            )
          ) : canApply ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="lg"
                  className="flex-1 bg-[#1a1f36] text-white hover:bg-[#252b47]"
                  onClick={() => setShowApply(true)}
                >
                  申請加入 <ChevronRight size={16} />
                </Button>
                <button
                  onClick={toggleFav}
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-colors ${
                    isFav ? 'border-red-100 bg-red-50 text-red-500' : 'border-line text-ink-2 hover:border-red-200 hover:text-red-400'
                  }`}
                  aria-label={isFav ? '取消收藏' : '加入收藏'}
                >
                  <Heart size={18} className={isFav ? 'fill-red-500' : ''} />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-ink-4">申請後需經團主審核，通過後即可加入群組</p>
            </>
          ) : (
            renderCTA()
          )}
        </div>
      }
      afterColumns={picks.length > 0 && (
        <div className="border-t border-line px-6 pb-4 pt-5">
          <h3 className="mb-4 text-lg font-black text-brand">其他推薦群組</h3>
          <div className="flex gap-3 overflow-x-auto px-0.5 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {picks.map(g => (
              <div key={g.id} className="w-64 shrink-0">
                <ExploreGroupCard group={g} isApplied={appliedGroupIds.has(g.id)} isMember={memberGroupIds.has(g.id)} />
              </div>
            ))}
          </div>
        </div>
      )}
    >
    </GroupModalShell>


    {/* 退出確認 */}
    {leaveConfirm && (
      <CountdownConfirmDialog
        title="確認退出群組？"
        message={`退出後將釋出名額，需重新申請才能加入「${group?.serviceName}」。`}
        confirmLabel="退出群組"
        danger
        onConfirm={handleLeave}
        onCancel={() => setLeaveConfirm(false)}
      />
    )}
    </>
  )
}
