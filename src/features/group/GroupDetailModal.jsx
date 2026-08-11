import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { getServiceById } from '../../common/utils/serviceUtils'
import { hasFilledServiceInfo } from '../../common/utils/serviceInfoFields'
import { useApplicationStore } from '../../common/stores/useApplicationStore'
import { useMemberStore } from '../../common/stores/useMemberStore'
import { useFavoriteStore } from '../../common/stores/useFavoriteStore'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { finalizeLeaveGroup } from './utils/leaveGroupFlow'
import { calcDisplayPrice } from '../../common/utils/pricingUtils'
import { toast } from '../../common/utils/toast'
import { useIsDesktop } from '../../common/utils/hooks'
import { TokenBadge } from '../../components/ui/TokenAmount'
import ConfirmActionDialog from '../../components/ui/ConfirmActionDialog'
import GroupModalShell from '../../components/ui/group/GroupModalShell'
import GroupPriceSeatSummary from '../../components/ui/group/GroupPriceSeatSummary'
import MemberGroupView from '../subscriptions/components/MemberGroupView'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'
import HostReviews from './components/HostReviews'
import ApplyModal from './components/ApplyModal'
import { buildMembersSubPanel } from './components/buildMembersSubPanel'
import { buildMobileFooter } from './components/buildMobileFooter'

export default function GroupDetailModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const [groupId, setGroupId]               = useState(null)
  const [showApply, setShowApply]           = useState(false)
  const [applyMessage, setApplyMessage]     = useState('')
  const [applyAgreed, setApplyAgreed]       = useState(false)
  const [applySubmitted, setApplySubmitted] = useState(false)
  const [showMembers, setShowMembers]           = useState(false)
  const [leaveConfirm, setLeaveConfirm]         = useState(false)
  const [cancelConfirm, setCancelConfirm]       = useState(false)
  const [cancelling, setCancelling]             = useState(false)
  const [applying, setApplying]                 = useState(false)
  const picksScrollRef = useRef(null)
  const picksObserverRef = useRef(null)
  const [picksAtStart, setPicksAtStart] = useState(true)
  const [picksAtEnd, setPicksAtEnd]     = useState(true)

  function measurePicksScroll(el) {
    // scrollWidth <= clientWidth 只代表「內容本身沒有超出容器」，不代表「目前已經捲到底」，
    // 要看目前捲動位置 + 容器寬度是否已經到達內容總寬度，右箭頭才會在捲到最後一張時正確消失
    setPicksAtStart(el.scrollLeft <= 0)
    setPicksAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }

  // 用 callback ref 而不是 useRef + useEffect：GroupModalShell 外層的 Dialog 進場動畫會讓
  // 這個捲動容器晚一個 commit 才真正掛載到 DOM（Dialog 內部另有自己的 mounted 狀態），
  // 用「掛載當下量一次」的 useEffect／useLayoutEffect（依賴 picks 是否變化）量到的常常是
  // 掛載前的舊 ref（null），且後續 picks 不再變化就永遠不會重新量測，導致明明有更多可捲動
  // 的推薦群組，右邊箭頭卻因為誤判「已到底」而不會顯示。callback ref 保證容器「真正接上
  // DOM 的那一刻」就會執行，不管是哪個祖先元件的哪一次 commit 造成的掛載
  function picksScrollCallbackRef(el) {
    picksObserverRef.current?.disconnect()
    picksObserverRef.current = null
    picksScrollRef.current = el
    if (!el) return
    measurePicksScroll(el)
    const observer = new ResizeObserver(() => measurePicksScroll(el))
    observer.observe(el)
    picksObserverRef.current = observer
  }

  // 一次只顯示一張卡片，直接用容器寬度（= 卡片寬度）當作捲動步進，不用寫死的像素值
  function scrollPicks(direction) {
    const el = picksScrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' })
  }

  function handlePicksScroll(e) {
    measurePicksScroll(e.currentTarget)
  }

  const isOpen       = !!groupId
  const isDesktop    = useIsDesktop()
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

  // 未登入點「登入以加入群組」導去 /login，登入/註冊成功後導回原本頁面時直接帶著
  // { reopenGroupModalId } 一起 navigate；比起再送一次 pm:open-group 事件更可靠——這個元件常常是透過
  // lazy() 動態載入（見 AppLayout／QuickMatchPage），剛掛載回來的當下監聽器不一定已經接上，
  // 用 location.state 才能保證掛載當下就讀得到，不會有時機競爭問題。讀取後立刻用 replace 清掉
  // state，避免使用者之後在同一頁面內部導頁時又被重複觸發打開。
  // 這個元件是全域掛載（AppLayout），不限頁面地監聽這個 state，欄位名稱不能跟 FloatingMessages.jsx
  // 通知點擊導去 /manage-groups、/my-subscriptions 帶的 openGroupId 撞名，否則會同時誤開這裡的
  // modal，變成疊兩層群組詳情 modal
  useEffect(() => {
    if (location.state?.reopenGroupModalId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroupId(location.state.reopenGroupModalId)
      resetApply()
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const group   = isOpen ? (groups.find(g => g.id === groupId) ?? null) : null
  const service = group ? getServiceById(group.serviceId) : null
  const plan    = service?.plans.find(p => p.name === group?.planName)

  const memberRecord        = group && activeUserId ? (members.find(m => m.userId === activeUserId && m.groupId === group.id) ?? null) : null
  const hasServiceInfoIssue = !!memberRecord?.serviceInfoIssueNote
  const hasServiceInfo      = hasFilledServiceInfo(memberRecord?.serviceInfo, service?.sharingMethod) && !hasServiceInfoIssue

  const picks = useMemo(() => {
    if (!group) return []
    const recruiting = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0 && g.id !== group.id && g.hostId !== activeUserId)
    return [
      ...recruiting.filter(g => g.serviceId === group.serviceId),
      ...recruiting.filter(g => g.serviceId !== group.serviceId),
    ]
  }, [group, groups, activeUserId])

  // 從「其他推薦群組」卡片切換到另一個群組時，picksScrollRef 是同一個 DOM 節點（沒有重新掛載，
  // callback ref 不會再觸發一次），但捲動內容（picks 卡片）換了一批，容器實際寬度也跟著變，
  // 這裡補一次重新量測，讓箭頭顯示狀態跟著新的內容同步
  useLayoutEffect(() => {
    if (picksScrollRef.current) measurePicksScroll(picksScrollRef.current)
  }, [picks])

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
  const isPaymentPhase      = ['pending_confirmation', 'pending_activation', 'active'].includes(group.status)
  const needsFillInfo       = isMember && isPaymentPhase && !hasServiceInfo
  const isWaitingMembers = isMember && ['recruiting', 'full'].includes(group.status)
  const isFull           = (group.openSeats ?? 0) <= 0

  // 直接從 store 讀取申請狀態，避免 state 在審核過渡期間不一致
  // approved && !isMember → false，確保退出後可重新申請
  const app          = activeUserId ? useApplicationStore.getState().getByUserAndGroup(activeUserId, group.id) : null
  const appStatus    = app?.status
  const hasActiveApp = !!app && appStatus !== 'rejected' && appStatus !== 'removed' && appStatus !== 'left' && appStatus !== 'cancelled' && !(appStatus === 'approved' && !isMember)
  const isPendingApp = appStatus === 'pending'

  const canApply = !isHost && !isMember && !hasActiveApp && !isFull && !!activeUserId

  function handleClose() { setGroupId(null); setShowMembers(false); setLeaveConfirm(false); setCancelConfirm(false); resetApply() }

  // 點「申請加入」當下就先比對餘額，不足就直接引導儲值，不用等填完留言表單送出才被後端擋下來
  function handleApplyClick() {
    const price = calcDisplayPrice(group.pricePerSeat, group.billingCycle)
    const balance = activeUser?.tokenBalance ?? 0
    if (price > balance) {
      toast('PM幣不足', 'error', {
        icon: <TokenBadge />,
        action: { label: '前往儲值', onClick: () => window.dispatchEvent(new CustomEvent('pm:open-topup')) },
      })
      return
    }
    setShowApply(true)
  }

  async function handleCancel() {
    if (cancelling || !app) return
    setCancelling(true)
    try {
      await useApplicationStore.getState().cancel(app.id)
      toast('已取消申請')
      setCancelConfirm(false)
      handleClose()
      navigate('/explore')
    } catch (err) {
      // 取消失敗最常見的原因是團主剛好搶先一步審核（後端條件式更新保證兩邊只有一個會成功）；
      // useApplicationStore.cancel() 失敗時已經連同 member/subscription 一起重新拉過最新資料，
      // 這裡直接讀重新整理後的真實狀態決定文案，而不是猜 HTTP 狀態碼——因為同樣是取消失敗，
      // 團主是「通過」還是「拒絕」給使用者看到的意義完全不同
      const freshStatus = useApplicationStore.getState().getByUserAndGroup(activeUserId, group.id)?.status
      const msg =
        freshStatus === 'approved' ? '慢了一步，團主剛好已經通過你的申請，你現在是這個群組的成員了' :
        freshStatus === 'rejected' ? '慢了一步，團主剛好已經拒絕了這筆申請，代管費用已退還' :
        (err?.response?.data?.message ?? err?.message ?? '取消申請失敗，請稍後再試')
      toast(msg, 'error')
      setCancelConfirm(false)
    } finally {
      setCancelling(false)
    }
  }

  async function handleApply() {
    if (!applyAgreed || applying) return
    setApplying(true)
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
      toast('申請已送出！')
      setApplySubmitted(true)
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? '申請失敗，請稍後再試'
      const code = err?.response?.data?.code
      if (code === 'INSUFFICIENT_BALANCE') {
        toast('PM幣不足', 'error', {
          icon: <TokenBadge />,
          action: { label: '前往儲值', onClick: () => window.dispatchEvent(new CustomEvent('pm:open-topup')) },
        })
      } else if (code === 'GROUP_NOT_RECRUITING') {
        // 畫面停留在舊資料時按下申請，剛好撞上團主已經解散/鎖定群組：後端已經整筆回滾，
        // 這裡把本地群組資料刷新成最新狀態，讓「申請加入」按鈕跟著消失，不會讓使用者一直重試
        toast('慢了一步，這個群組剛好被團主解散或已額滿，無法申請', 'error')
        useGroupStore.getState().refreshGroup(group.id).catch(console.error)
      } else if (code === 'REAPPLY_COOLDOWN') {
        toast('你最近曾被移出此群組，暫時無法重新申請', 'error')
      } else if (code === 'CREDIT_SCORE_TOO_LOW') {
        toast('信用分數不足，無法申請此群組', 'error')
      } else {
        toast(msg, 'error')
      }
    } finally {
      setApplying(false)
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
    else navigate('/login', { state: { from: location.pathname + location.search, reopenGroupModalId: group.id } })
  }

  // 已經是成員時，不管從哪個入口（探索頁、訊息、儲值紀錄…）打開群組詳情，
  // 一律統一顯示跟「我的訂閱」/「群組管理」同一份內容，不要讓同一個群組在不同入口看到不同版本
  if (isMember && !isHost) {
    return <MemberGroupView group={group} onLeaveGroup={handleLeave} onClose={handleClose} />
  }

  const reviews = (
    <HostReviews
      group={group}
      headerClassName="text-lg font-black text-brand"
      onDm={activeUserId && !isHost ? openDm : undefined}
      scrollable
      topPadding={!isDesktop}
      squareDmButton={isDesktop}
    />
  )

  const picksInner = (
    <>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-brand">
        <Sparkles size={16} strokeWidth={1.5} className="shrink-0" />
        其他推薦群組
      </h3>
      <div className="relative">
        {!picksAtStart && (
          <button
            type="button"
            onClick={() => scrollPicks(-1)}
            aria-label="往左看更多"
            className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-md transition-colors hover:bg-raised hover:text-ink can-hover:grid"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
        )}
        <div
          ref={picksScrollCallbackRef}
          onScroll={handlePicksScroll}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {picks.map(g => (
            <div key={g.id} className="w-full shrink-0 snap-center">
              <ExploreGroupCard group={g} isApplied={appliedGroupIds.has(g.id)} isMember={memberGroupIds.has(g.id)} />
            </div>
          ))}
        </div>
        {!picksAtEnd && (
          <button
            type="button"
            onClick={() => scrollPicks(1)}
            aria-label="往右看更多"
            className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-md transition-colors hover:bg-raised hover:text-ink can-hover:grid"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </>
  )

  // 桌機（lg+）改成左右分欄：左邊維持群組資訊／規則／服務說明，右邊放團主評價／推薦群組／
  // 價格與名額／申請、收藏按鈕；手機／平板維持原本單欄由上到下的排列，不受影響。
  // showMembers（群組名單）分頁沒有這個分欄需求，只在概覽分頁套用
  const showDesktopAside = isDesktop && !showMembers
  const hideRecruitBarBase = isMember || isHost || group.status !== 'recruiting'
  const footerCta = buildMobileFooter({
    group, activeUserId, navigate, handleClose,
    isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue,
    isSharedCredentials: service?.sharingMethod === 'shared_credentials',
    isMember, isPendingApp, isFull, canApply, isFav,
    cancelConfirm, setCancelConfirm, cancelling, handleCancel,
    setShowMembers, setLeaveConfirm, onApplyClick: handleApplyClick, toggleFav,
    padded: !showDesktopAside,
    squareFavorite: showDesktopAside,
    redirectAfterLogin: { from: location.pathname + location.search, reopenGroupModalId: group.id },
  })

  return (
    <>
    {/* 申請加入 sub-modal — 開啟時隱藏後方的群組詳情 */}
    <ApplyModal
      group={group}
      isOpen={showApply}
      onClose={resetApply}
      applyMessage={applyMessage}
      setApplyMessage={setApplyMessage}
      applyAgreed={applyAgreed}
      setApplyAgreed={setApplyAgreed}
      applySubmitted={applySubmitted}
      applying={applying}
      onApply={handleApply}
    />

    {/* 群組詳情 modal — 申請 sub-modal 開啟時隱藏 */}
    {!showApply && <GroupModalShell
      onClose={handleClose}
      group={group}
      service={service}
      plan={plan}
      hideRecruitBar={hideRecruitBarBase || showDesktopAside}
      extraInfoRows={[]}
      statusBadgeOverride={
        isMember && group.status === 'recruiting' ? 'member_joined' :
        isPendingApp ? { variant: 'pending', label: '審核中' } :
        undefined
      }
      subPanel={showMembers ? buildMembersSubPanel({ group, groupId, members, activeUserId, setShowMembers, openDm }) : null}
      onSubPanelBack={() => { setShowMembers(false); resetApply() }}
      panelKey={showMembers ? 'members' : `overview-${groupId}`}
      headerBanner={
        isWaitingMembers ? (
          <div className="flex items-center justify-center gap-2 bg-success-subtle px-6 py-3 text-sm font-medium text-success-text">
            <CheckCircle2 size={15} />
            {group.status === 'full' ? '招募完成，等待團主鎖定群組' : '已通過申請，需等待其他人加入'}
          </div>
        ) : isPendingApp ? (
          <div className="flex items-center justify-center gap-2 bg-warning-subtle px-6 py-3 text-sm font-medium text-warning-text">
            <CheckCircle2 size={15} />已送出申請，等待團主審核
          </div>
        ) : undefined
      }
      mobileReviewsSection={showDesktopAside ? undefined : reviews}
      mobileFooter={showDesktopAside ? undefined : footerCta}
      afterColumns={picks.length > 0 && (
        <div className="border-t border-line px-6 pb-4 pt-5">{picksInner}</div>
      )}
      desktopAsideTop={showDesktopAside && reviews}
      desktopAsideBottom={showDesktopAside && (
        <div className="space-y-4">
          {!hideRecruitBarBase && <GroupPriceSeatSummary group={group} />}
          {footerCta}
        </div>
      )}
    >
    </GroupModalShell>}

    {/* 退出確認 */}
    {leaveConfirm && (
      <ConfirmActionDialog
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
