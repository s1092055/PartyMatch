import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Bell, CalendarClock, CheckCircle2, ClipboardEdit, MessageSquare, PlayCircle, Star, UserPlus } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from '../../components/ui/drawer'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../stores/useAuthStore'
import { useApplicationStore } from '../stores/useApplicationStore'
import { useGroupStore } from '../stores/useGroupStore'
import { useMemberStore } from '../stores/useMemberStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useSubscriptionStore } from '../stores/useSubscriptionStore'
import { formatRelativeDate } from '../utils/date'
import { toast } from '../utils/toast'
import { getServiceById } from '../utils/serviceUtils'
import { isSharedCredentialsMethod } from '../utils/serviceInfoFields'
import EmptyState from '../../components/ui/primitives/EmptyState'
import SearchInput from '../../components/ui/primitives/SearchInput'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuRadioSection, DropdownMenuFilterTrigger,
} from '../../components/ui/dropdown-menu'

const getGroupById = (id) => useGroupStore.getState().getById(id)
const getCurrentUser = () => useAuthStore.getState().user
const getSubscriptionByUserAndGroup = (uid, gid) => useSubscriptionStore.getState().getByUserAndGroup(uid, gid)

// 通知指向的群組可能在通知建立之後就額滿／不再招募中（例如被別人申請填滿），這種情況下
// 開啟一個「已經不能申請」的群組詳情 Modal 沒有意義，改成跳 toast 說明並留在探索頁瀏覽其他群組。
// 先重新拉一次群組資料，避免用本地過期的 recruiting 快取誤判。
async function openGroupOrRedirect(groupId) {
  await useGroupStore.getState().init({ all: true })
  const grp = getGroupById(groupId)
  if (!grp || grp.status !== 'recruiting') {
    toast('此群組已額滿或不再招募', 'info')
    return
  }
  window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId } }))
}

// 通知指向的群組，使用者可能已經不再是成員（被移除／自己退出／申訴後出局），此時「我的訂閱」
// 對他來說什麼都打不開，一律改導向探索頁；還有名額就直接開群組詳情 Modal，額滿就跳 toast，
// 跟上面 openGroupOrRedirect 同一套邏輯，不能開就不能開。先重新拉一次 memberStore／groupStore
// 再判斷：觸發這個函式的通知（續訂、申訴裁定、服務啟用）本身就代表 member 資格或 group.status
// 剛剛發生變化，本地快取這時大機率是舊的，用舊快取判斷會誤判成員資格或顯示舊狀態
function navigateToMemberGroupOrExplore(navigate, userId, groupId, extraState) {
  Promise.all([
    useMemberStore.getState().init(),
    useGroupStore.getState().init({ all: true }),
  ]).finally(() => {
    if (userId && useMemberStore.getState().getByUserAndGroup(userId, groupId)) {
      navigate('/my-subscriptions', { state: { openGroupId: groupId, ...extraState } })
    } else {
      navigate('/explore')
      openGroupOrRedirect(groupId)
    }
  })
}

function getMergedNotifications(userId) {
  const notifStore = useNotificationStore.getState()
  const personal = userId ? notifStore.getByUserId(userId) : []
  const system   = notifStore.getSystemNotifications().filter(n => n.id !== 'system_guest_welcome')
  const seen     = new Set(personal.map(n => n.id))
  return [...personal, ...system.filter(n => !seen.has(n.id))].sort(
    (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  )
}

const NOTIFICATION_META = {
  application_approved: { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions', state: { tab: 'processing' } },
  application_rejected: { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  application_sent:     { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-subscriptions', state: { tab: 'processing' } },
  group_created:        { icon: CheckCircle2,  iconColor: 'text-success',    link: '/manage-groups' },
  new_application:      { icon: UserPlus,      iconColor: 'text-brand',      link: '/manage-groups' },
  application_cancelled: { icon: AlertCircle,  iconColor: 'text-ink-3',      link: '/manage-groups' },
  group_full:           { icon: UserPlus,      iconColor: 'text-brand',      link: '/manage-groups' },
  group_chat_opened:    { icon: MessageSquare, iconColor: 'text-brand',      link: null },
  fill_service_info:    { icon: ClipboardEdit, iconColor: 'text-warning-text', link: '/my-subscriptions' },
  service_info_filled:  { icon: ClipboardEdit, iconColor: 'text-success',    link: '/manage-groups' },
  all_service_info_filled: { icon: PlayCircle, iconColor: 'text-success',    link: '/manage-groups' },
  service_info_deadline_passed: { icon: AlertCircle, iconColor: 'text-warning-text', link: '/manage-groups' },
  group_activated:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions' },
  group_cancelled:      { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  group_renewal:        { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-subscriptions' },
  upcoming_renewal:     { icon: AlertCircle,   iconColor: 'text-warning-text', link: '/my-subscriptions', state: { tab: 'active' } },
  service_info_issue:   { icon: AlertCircle,   iconColor: 'text-amber-500',  link: '/my-subscriptions' },
  group_ended:          { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/explore' },
  member_removed:       { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  member_left:          { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/manage-groups' },
  escrow_released:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/manage-groups' },
  dispute_raised:       { icon: AlertCircle,   iconColor: 'text-danger',     link: '/manage-groups' },
  dispute_resolved:     { icon: CheckCircle2,  iconColor: 'text-info',       link: '/my-subscriptions' },
  dispute_resolved_by_host: { icon: CheckCircle2, iconColor: 'text-info',    link: '/my-subscriptions' },
  billing_date_confirmed: { icon: CalendarClock, iconColor: 'text-brand',      link: '/my-subscriptions' },
  billing_date_adjusted:  { icon: CalendarClock, iconColor: 'text-warning-text', link: '/my-subscriptions' },
  member_confirmed_service: { icon: CheckCircle2, iconColor: 'text-success',   link: '/manage-groups' },
  group_reviewed:          { icon: Star,          iconColor: 'text-warning-text', link: '/manage-groups' },
  system:               { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/' },
  default:              { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/my-subscriptions' },
}

function getMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.default
}

const APPLY_TYPES   = ['joined', 'application_approved', 'application_rejected', 'application_sent', 'new_application', 'application_cancelled', 'application']
const SYSTEM_TYPES  = ['system']

const TABS = [
  { id: 'all',    label: '全部', filter: () => true },
  { id: 'apply',  label: '申請', filter: n => APPLY_TYPES.includes(n.type) },
  { id: 'system', label: '系統', filter: n => SYSTEM_TYPES.includes(n.type) && (!n.userId || n.userId === 'system' || n.isPublic === true) },
]

const SORT_OPTIONS = [
  { id: 'newest', label: '最新在前' },
  { id: 'oldest', label: '最舊在前' },
]

export default function FloatingMessages() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const currentUser = useAuthStore(s => s.user)
  const userId = currentUser?.id
  // 訂閱通知 store，通知更新時自動重新計算列表
  const notificationsState = useNotificationStore(s => s.notifications)

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(() => loggedIn ? 'all' : 'system')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' | 'oldest'
  const [searchQuery, setSearchQuery] = useState('')

  const notifications = useMemo(
    () => loggedIn
      ? getMergedNotifications(userId)
      : useNotificationStore.getState().getSystemNotifications(),
    // notificationsState 為刻意依賴：通知 store 更新時重新計算列表
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loggedIn, userId, notificationsState],
  )

  useEffect(() => {
    function onOpen() {
      setActiveTab(useAuthStore.getState().loggedIn ? 'all' : 'system')
      setOpen(true)
    }
    window.addEventListener('pm:open-notify', onOpen)
    return () => window.removeEventListener('pm:open-notify', onOpen)
  }, [])

  const visibleTabs = useMemo(() => loggedIn ? TABS : TABS.filter(t => t.id === 'system'), [loggedIn])

  const unreadCount = useMemo(
    () => loggedIn ? notifications.filter(n => !n.isRead).length : 0,
    [loggedIn, notifications]
  )

  const filtered = useMemo(() => {
    const tab = visibleTabs.find(t => t.id === activeTab)
    let result = tab ? notifications.filter(tab.filter) : notifications
    if (unreadOnly) result = result.filter(n => !n.isRead)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(n => n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q))
    }
    // notifications 本身已經是 createdAt 新到舊排序（見 getMergedNotifications），這裡只有
    // 選「最舊優先」時才需要額外反轉，「最新優先」維持原本順序即可，不用多做一次排序運算
    return sortOrder === 'oldest' ? [...result].reverse() : result
  }, [activeTab, notifications, visibleTabs, unreadOnly, searchQuery, sortOrder])

  function handleMarkAllRead() {
    if (!userId) return
    useNotificationStore.getState().markAllRead(userId)
  }

  function handleClick(notification) {
    if (!userId) {
      const link = getMeta(notification.type).link
      if (link && !['/my-subscriptions', '/manage-groups', '/account', '/favorites'].includes(link)) {
        setOpen(false)
        // 系統歡迎通知導回首頁時順便整頁刷新，讓訪客回到最乾淨的初始畫面（不只是換路由）
        if (link === '/') {
          window.location.replace('/')
        } else {
          navigate(link)
        }
      }
      return
    }

    useNotificationStore.getState().markRead(notification.id)
    setOpen(false)

    if (notification.type === 'group_chat_opened' && notification.meta?.groupId) {
      window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if (notification.type === 'fill_service_info' && notification.meta?.groupId) {
      // 直接開該群組的成員視角詳情；團主提供帳密的服務（shared_credentials）直接落在「帳號資訊」
      // 分頁（見 MemberGroupView 的 autoOpenCredentials），其他服務則依 needsFillInfo 自動顯示
      // 「請填寫服務帳號」橫幅與按鈕，不需要導向特定子面板；已經不是成員的話（例如點擊前已被移除）
      // 改導向探索頁。團主鎖定群組後 group.status 才會變成 pending_confirmation，本地 groupStore
      // 快取此時可能還停在鎖定前的舊狀態（尚未輪詢到），needsFillInfo 判斷式讀到舊 status 會誤判成
      // 不用填寫，導致 modal 開啟當下「填寫服務帳號」按鈕沒有馬上顯示，須先重新拉一次群組資料
      useGroupStore.getState().init({ all: true }).finally(() => {
        const grp = getGroupById(notification.meta.groupId)
        const isSharedCredentials = isSharedCredentialsMethod(getServiceById(grp?.serviceId)?.sharingMethod)
        navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId, isSharedCredentials ? { openCredentials: true } : undefined)
      })
      return
    }

    if (notification.type === 'group_created' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
      window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId } }))
      return
    }

    if (notification.type === 'application_sent' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const user = getCurrentUser()
      // 同 application_approved：本地 subscriptionStore／applicationStore／groupStore 快取可能還沒
      // 反映最新接受結果（含群組是否剛好額滿），先重新拉一次再判斷
      Promise.all([
        useSubscriptionStore.getState().init(),
        useApplicationStore.getState().init(),
        useGroupStore.getState().init({ all: true }),
      ]).finally(() => {
        const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
        if (hasSub) {
          // 申請已通過，以成員視角開啟
          navigate('/my-subscriptions', { state: { openGroupId: gId } })
          return
        }
        // 申請仍待審核：群組如果還在招募中，以探索視角開啟（與 ApplicationCard 一致）；
        // 但如果名額已經被別人佔滿或群組不再招募，這筆申請等於已經沒有下文（後端不會
        // 主動幫還卡在 pending 的申請人自動拒絕），跟點擊「申請未通過」通知一樣導向
        // 探索頁並顯示 toast，不要硬開一個進不去、按鈕都是灰的群組詳情
        // groupStore 剛在上面的 Promise.all 重新拉過，這裡的 grp 已經是最新資料，
        // 不用再呼叫 openGroupOrRedirect（它會再多打一次 groupStore.init 重覆同一次網路請求）
        const grp = getGroupById(gId)
        if (grp && grp.status === 'recruiting') {
          navigate('/my-subscriptions', { state: { tab: 'processing' } })
          window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: gId } }))
        } else {
          navigate('/explore')
          toast('此群組已額滿或不再招募', 'info')
        }
      })
      return
    }

    if (notification.type === 'application_rejected') {
      const gId = notification.meta?.groupId
      // 申請人本地 applicationStore 的申請紀錄還停在 pending，要重新拉一次才會變成
      // rejected，讓群組卡片的「已申請」標記立即消失、恢復成可重新申請的狀態
      navigate('/explore')
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 代管費用已退款，重新拉最新餘額
      useApplicationStore.getState().init().finally(() => {
        if (gId) openGroupOrRedirect(gId)
      })
      return
    }

    if (notification.type === 'member_left') {
      if (notification.meta?.groupId) {
        // 團主收到「成員退出群組」通知
        window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'))
        navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId } }))
      } else {
        // 成員自己收到「已退出群組」確認通知
        navigate('/my-subscriptions')
      }
      return
    }

    if (notification.type === 'member_removed' && notification.meta?.groupId) {
      window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'))
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 代管費用已退款，重新拉最新餘額
      useAuthStore.getState().refreshCreditScore().catch(console.error)  // 被移出群組，信用分數已扣分，重新拉最新分數
      navigate('/explore')
      openGroupOrRedirect(notification.meta.groupId)
      return
    }

    if (notification.type === 'application_approved' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const user = getCurrentUser()
      // 本地 subscriptionStore／memberStore 可能還停在接受前的快照（尚未輪詢到新建立的訂閱/成員資料），
      // 用過期快取判斷會誤判成「尚無訂閱」導致導向探索頁而非會員視角；memberStore 沒同步刷新的話，
      // 群組詳情 Modal 打開當下 myMember 會是 null，「退出群組」按鈕也會因此不會馬上顯示，須先重新拉一次；
      // applicationStore 沒有一起刷新的話，這筆申請在本地還是 pending，「處理中」分頁會多出一筆
      // 早就已經核准、理論上該消失的「審核中」幽靈紀錄；groupStore 沒有一起刷新的話，這筆申請剛好是
      // 最後一個名額時，本地 group.status 還停在鎖定前的 recruiting，MemberGroupView 會誤判成「已通過
      // 申請，需等待其他人加入」而不是「等待鎖定」，跟 fill_service_info 是同一種快取過期問題
      Promise.all([
        useSubscriptionStore.getState().init(),
        useMemberStore.getState().init(),
        useApplicationStore.getState().init(),
        useGroupStore.getState().init({ all: true }),
      ]).finally(() => {
        const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
        if (hasSub) {
          // 已通過的申請一律停在「處理中」分頁再開群組詳情，不管群組實際狀態是 recruiting 還是
          // full，都跟「審核中的申請併入處理中」是同一種語意——申請人視角上這件事還沒完全塵埃落定
          navigate('/my-subscriptions', { state: { tab: 'processing', openGroupId: gId } })
        } else {
          navigate('/explore')
          openGroupOrRedirect(gId)
        }
      })
      return
    }

    if (notification.type === 'new_application' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } })
      useApplicationStore.getState().init().finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } }))
      })
      return
    }

    if (notification.type === 'service_info_filled' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openMemberInfo: true } })
      // 先重新拉一次成員資料，避免打開「帳號資訊」分頁時看到的還是填寫當下的舊快取
      useMemberStore.getState().init().finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId, openMemberInfo: true } }))
      })
      return
    }

    if (notification.type === 'application_cancelled' && notification.meta?.groupId) {
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } })
      useApplicationStore.getState().init().finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: notification.meta.groupId, statusFilter: 'recruiting', openApplications: true } }))
      })
      return
    }

    if (notification.type === 'group_full' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      // 這則通知本身就代表群組剛額滿、有新成員加入，group.status／成員名單的本地快取一定是舊的
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
      ]).finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
      })
      return
    }

    if (notification.type === 'all_service_info_filled' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      // 這則通知本身就代表 group.status 剛從 pending_confirmation 推進到 pending_activation，
      // 本地快取還停在舊狀態的話，「啟用服務」按鈕不會馬上出現，須先重新拉一次
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
      ]).finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
      })
      return
    }

    if (notification.type === 'member_confirmed_service' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      // 這則通知代表某成員的 confirmedAt 剛被寫入，本地 memberStore 快取還停在確認前的舊值
      useMemberStore.getState().init().finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
      })
      return
    }

    if (notification.type === 'group_reviewed' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
      return
    }

    if (notification.type === 'service_info_deadline_passed' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      navigate('/manage-groups', { state: { openGroupId: gId } })
      // 這則通知代表群組剛被伺服器自動退回 recruiting（有成員逾期被移出），本地快取一定是舊的
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
        useApplicationStore.getState().init(),
      ]).finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
      })
      return
    }

    if (notification.type === 'escrow_released' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 代管款項已撥款，重新拉最新餘額
      navigate('/manage-groups', { state: { openGroupId: gId } })
      // 撥款代表 group.status 剛轉成服務中，先重新拉一次
      useGroupStore.getState().init({ all: true }).finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
      })
      return
    }

    if (notification.type === 'dispute_raised' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      // 直接開「帳號資訊」分頁看成員回報的問題內容，跟 service_info_filled 同一套做法；
      // group.status 剛轉成申訴中、成員的 serviceInfoIssueNote 也才剛寫入，兩份本地快取都要重新拉
      navigate('/manage-groups', { state: { openGroupId: gId, openMemberInfo: true } })
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
      ]).finally(() => {
        window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId, openMemberInfo: true } }))
      })
      return
    }

    if (notification.type === 'dispute_resolved_by_host' && notification.meta?.groupId) {
      // 團主自行協調解決，只會發給申訴成員本人，不影響餘額，不用判斷團主/成員視角
      navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
      return
    }

    if (notification.type === 'dispute_resolved' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 裁定結果不管撥款或退款，都影響餘額
      // hostId 是固定欄位，不會因裁定而變，用目前的本地快取判斷角色不會有問題；
      // 但裁定後 group.status／成員名單一定變了，兩邊分支各自負責重新整理自己要用的資料
      const grp = getGroupById(gId)
      if (grp && grp.hostId === userId) {
        navigate('/manage-groups', { state: { openGroupId: gId } })
        Promise.all([
          useGroupStore.getState().init({ all: true }),
          useMemberStore.getState().init(),
        ]).finally(() => {
          window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
        })
      } else {
        // 申訴不成立則成員仍在群組內；申訴成立則申訴成員已被移出群組——
        // 是否還是成員交給共用函式判斷，不是成員就導向探索頁
        navigateToMemberGroupOrExplore(navigate, userId, gId)
      }
      return
    }

    if (notification.type === 'group_activated' && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const grp = getGroupById(gId)
      if (grp && grp.hostId === userId) {
        navigate('/manage-groups', { state: { openGroupId: gId } })
        // 啟用服務代表 group.status 剛從待啟用轉成確認期，先重新拉一次
        useGroupStore.getState().init({ all: true }).finally(() => {
          window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
        })
      } else {
        navigateToMemberGroupOrExplore(navigate, userId, gId)
      }
      return
    }

    if ((notification.type === 'billing_date_confirmed' || notification.type === 'billing_date_adjusted') && notification.meta?.groupId) {
      const gId = notification.meta.groupId
      const grp = getGroupById(gId)
      if (grp && grp.hostId === userId) {
        navigate('/manage-groups', { state: { openGroupId: gId } })
        useGroupStore.getState().init({ all: true }).finally(() => {
          window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: gId } }))
        })
      } else {
        navigateToMemberGroupOrExplore(navigate, userId, gId)
      }
      return
    }

    if (notification.type === 'group_renewal' && notification.meta?.groupId) {
      navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
      return
    }

    if (notification.type === 'upcoming_renewal' && notification.meta?.groupId) {
      navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
      return
    }

    if (notification.type === 'group_cancelled') {
      // 群組解散於鎖定前，此時成員尚未有訂閱紀錄可開啟；改導向探索頁找其他群組，
      // 不要停在「我的訂閱」——那裡本來就不會列出已解散的群組，留在原地只會讓人
      // 對著空白/舊畫面疑惑。輪詢每 5 秒偵測到這則通知時已經會刷新 group/member 等
      // store（見 useNotificationStore），這裡再刷一次是為了使用者搶在輪詢之前
      // 手動點開通知的情境，確保探索頁列表不會殘留這個已解散的群組
      useAuthStore.getState().refreshTokenBalance().catch(console.error) // 代管費用已退款，重新拉最新餘額
      navigate('/explore')
      useGroupStore.getState().init({ all: true })
      return
    }

    const meta = getMeta(notification.type)
    if (!meta.link) return
    navigate(meta.link, meta.state ? { state: meta.state } : undefined)
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerContent
        className="rounded-2xl border border-line"
        style={{ '--drawer-inset': '0.75rem', '--drawer-bleed-background': 'transparent' }}
      >
        <DrawerHeader>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-ink-3" />
            <DrawerTitle>通知</DrawerTitle>
            {!loggedIn && (
              <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-bold text-ink-3">
                系統公告
              </span>
            )}
            {unreadCount > 0 && (
              <span className="rounded-full bg-danger-subtle px-2 py-0.5 text-xs font-bold text-danger-text">
                {unreadCount} 未讀
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-brand transition-colors hover:text-brand-hover"
            >
              全部已讀
            </button>
          )}
        </DrawerHeader>
        <DrawerDescription className="sr-only">通知中心</DrawerDescription>

        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="搜尋通知..." />
          {visibleTabs.length > 1 && (
            <DropdownMenu>
              <DropdownMenuFilterTrigger
                active={activeTab !== 'all' || unreadOnly || sortOrder !== 'newest'}
                ariaLabel="篩選通知"
              />
              <DropdownMenuContent>
                <DropdownMenuRadioSection label="顯示範圍" options={visibleTabs} value={activeTab} onValueChange={setActiveTab} />
                <DropdownMenuRadioSection label="排序" options={SORT_OPTIONS} value={sortOrder} onValueChange={setSortOrder} />
                <DropdownMenuCheckboxItem checked={unreadOnly} onCheckedChange={setUnreadOnly}>
                  只顯示未讀
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={loggedIn ? '沒有通知' : '沒有系統公告'}
              description={loggedIn && activeTab === 'all' ? '加入或建立群組後會顯示動態' : loggedIn ? '這裡沒有訊息' : '目前沒有公告'}
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-line-subtle">
              {filtered.map(n => {
                const { icon: Icon, iconColor } = getMeta(n.type)
                const isUnread = loggedIn && !n.isRead

                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-raised ${
                      isUnread ? 'bg-brand-subtle/30' : ''
                    }`}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-raised">
                      <Icon size={16} className={iconColor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-3">{n.message}</p>
                      <p className="mt-1 text-xs text-ink-4">{formatRelativeDate(n.createdAt)}</p>
                    </div>
                    {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-danger" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={() => setOpen(false)}
            className="w-full rounded-lg"
          >
            關閉
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
