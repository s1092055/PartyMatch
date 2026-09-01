import { AlertCircle, CalendarClock, CheckCircle2, ClipboardEdit, MessageSquare, PlayCircle, Star, UserPlus } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import { useApplicationStore } from '../stores/useApplicationStore'
import { useGroupStore } from '../stores/useGroupStore'
import { useMemberStore } from '../stores/useMemberStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { useSubscriptionStore } from '../stores/useSubscriptionStore'
import { toast } from '../utils/toast'
import { getServiceById } from '../utils/serviceUtils'
import { isSharedCredentialsMethod } from '../utils/serviceInfoFields'

const getGroupById = (id) => useGroupStore.getState().getById(id)
const getCurrentUser = () => useAuthStore.getState().user
const getSubscriptionByUserAndGroup = (uid, gid) => useSubscriptionStore.getState().getByUserAndGroup(uid, gid)

function openHostGroup(groupId, extra) {
  window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId, ...extra } }))
}

async function openGroupOrRedirect(groupId) {
  await useGroupStore.getState().init({ all: true })
  const grp = getGroupById(groupId)
  if (!grp || grp.status !== 'recruiting') {
    toast('此群組已額滿或不再招募', 'info')
    return
  }
  window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId } }))
}

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

export const NOTIFICATION_META = {
  application_approved: { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions' },
  application_rejected: { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  application_sent:     { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-subscriptions' },
  group_created:        { icon: CheckCircle2,  iconColor: 'text-success',    link: '/manage-groups' },
  new_application:      { icon: UserPlus,      iconColor: 'text-brand',      link: '/manage-groups' },
  application_cancelled: { icon: AlertCircle,  iconColor: 'text-ink-3',      link: '/manage-groups' },
  group_full:           { icon: UserPlus,      iconColor: 'text-brand',      link: '/manage-groups' },
  group_full_member:    { icon: UserPlus,      iconColor: 'text-brand',      link: '/my-subscriptions' },
  group_chat_opened:    { icon: MessageSquare, iconColor: 'text-brand',      link: null },
  fill_service_info:    { icon: ClipboardEdit, iconColor: 'text-warning-text', link: '/my-subscriptions' },
  service_info_filled:  { icon: ClipboardEdit, iconColor: 'text-success',    link: '/manage-groups' },
  all_service_info_filled: { icon: PlayCircle, iconColor: 'text-success',    link: '/manage-groups' },
  service_info_deadline_passed: { icon: AlertCircle, iconColor: 'text-warning-text', link: '/manage-groups' },
  group_activated:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/my-subscriptions' },
  group_cancelled:      { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  group_renewal:        { icon: CheckCircle2,  iconColor: 'text-brand',      link: '/my-subscriptions' },
  upcoming_renewal:     { icon: AlertCircle,   iconColor: 'text-warning-text', link: '/my-subscriptions' },
  service_info_issue:   { icon: AlertCircle,   iconColor: 'text-amber-500',  link: '/my-subscriptions' },
  group_ended:          { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/explore' },
  member_removed:       { icon: AlertCircle,   iconColor: 'text-danger',     link: '/explore' },
  member_left:          { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/manage-groups' },
  escrow_released:      { icon: CheckCircle2,  iconColor: 'text-success',    link: '/manage-groups' },
  escrow_released_member: { icon: CheckCircle2, iconColor: 'text-success',   link: '/my-subscriptions' },
  dispute_raised:       { icon: AlertCircle,   iconColor: 'text-danger',     link: '/manage-groups' },
  dispute_resolved:     { icon: CheckCircle2,  iconColor: 'text-info',       link: '/my-subscriptions' },
  dispute_resolved_by_host: { icon: CheckCircle2, iconColor: 'text-info',    link: '/my-subscriptions' },
  billing_date_confirmed: { icon: CalendarClock, iconColor: 'text-brand',      link: '/my-subscriptions' },
  billing_date_adjusted:  { icon: CalendarClock, iconColor: 'text-warning-text', link: '/my-subscriptions' },
  member_confirmed_service: { icon: CheckCircle2, iconColor: 'text-success',   link: '/manage-groups' },
  group_reviewed:          { icon: Star,          iconColor: 'text-warning-text', link: '/manage-groups' },
  account_reactivated:  { icon: CheckCircle2,  iconColor: 'text-success',    link: '/' },
  payment_reminder:     { icon: AlertCircle,   iconColor: 'text-warning-text', link: '/my-subscriptions' },
  system:               { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/' },
  default:              { icon: AlertCircle,   iconColor: 'text-ink-3',      link: '/my-subscriptions' },
}

export function getMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.default
}

export function handleNotificationClick(notification, { userId, navigate, setOpen }) {
  if (!userId) {
    const link = getMeta(notification.type).link
    if (link && !['/my-subscriptions', '/manage-groups', '/favorites'].includes(link)) {
      setOpen(false)
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
    navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
    return
  }

  if (notification.type === 'service_info_issue' && notification.meta?.groupId) {
    useGroupStore.getState().init({ all: true }).finally(() => {
      const grp = getGroupById(notification.meta.groupId)
      const isSharedCredentials = isSharedCredentialsMethod(getServiceById(grp?.serviceId)?.sharingMethod)
      navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId, isSharedCredentials ? { openCredentials: true } : undefined)
    });
    return
  }

  if (notification.type === 'group_created' && notification.meta?.groupId) {
    navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
    openHostGroup(notification.meta.groupId)
    return
  }

  if (notification.type === 'application_sent' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    const user = getCurrentUser()
    Promise.all([
      useSubscriptionStore.getState().init(),
      useApplicationStore.getState().init(),
      useGroupStore.getState().init({ all: true }),
    ]).finally(() => {
      const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
      if (hasSub) {
        navigate('/my-subscriptions', { state: { openGroupId: gId } });
        return
      }
      const grp = getGroupById(gId);
      if (grp && grp.status === 'recruiting') {
        navigate('/my-subscriptions')
        window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: gId } }))
      } else {
        navigate('/explore')
        toast('此群組已額滿或不再招募', 'info')
      }
    });
    return
  }

  if (notification.type === 'application_rejected') {
    const gId = notification.meta?.groupId
    navigate('/explore');
    useAuthStore.getState().refreshTokenBalance().catch(console.error);
    useApplicationStore.getState().init().finally(() => {
      if (gId) openGroupOrRedirect(gId)
    })
    return
  }

  if (notification.type === 'member_left') {
    if (notification.meta?.groupId) {
      window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'));
      navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId } })
      openHostGroup(notification.meta.groupId)
    } else {
      navigate('/my-subscriptions');
    }
    return
  }

  if (notification.type === 'member_removed' && notification.meta?.groupId) {
    window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'))
    useAuthStore.getState().refreshTokenBalance().catch(console.error);
    useAuthStore.getState().refreshCreditScore().catch(console.error);
    navigate('/explore')
    openGroupOrRedirect(notification.meta.groupId)
    return
  }

  if (notification.type === 'application_approved' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    const user = getCurrentUser()
    Promise.all([
      useSubscriptionStore.getState().init(),
      useMemberStore.getState().init(),
      useApplicationStore.getState().init(),
      useGroupStore.getState().init({ all: true }),
    ]).finally(() => {
      const hasSub = user ? !!getSubscriptionByUserAndGroup(user.id, gId) : false
      if (hasSub) {
        navigate('/my-subscriptions', { state: { openGroupId: gId } });
      } else {
        navigate('/explore')
        openGroupOrRedirect(gId)
      }
    });
    return
  }

  if (notification.type === 'new_application' && notification.meta?.groupId) {
    navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openApplications: true } })
    useApplicationStore.getState().init().finally(() => {
      openHostGroup(notification.meta.groupId, { openApplications: true })
    })
    return
  }

  if (notification.type === 'service_info_filled' && notification.meta?.groupId) {
    navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openMemberInfo: true } })
    useMemberStore.getState().init().finally(() => {
      openHostGroup(notification.meta.groupId, { openMemberInfo: true })
    });
    return
  }

  if (notification.type === 'application_cancelled' && notification.meta?.groupId) {
    navigate('/manage-groups', { state: { openGroupId: notification.meta.groupId, openApplications: true } })
    useApplicationStore.getState().init().finally(() => {
      openHostGroup(notification.meta.groupId, { openApplications: true })
    })
    return
  }

  if (notification.type === 'group_full' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    navigate('/manage-groups', { state: { openGroupId: gId } })
    Promise.all([
      useGroupStore.getState().init({ all: true }),
      useMemberStore.getState().init(),
    ]).finally(() => {
      openHostGroup(gId)
    });
    return
  }

  if (notification.type === 'group_full_member' && notification.meta?.groupId) {
    navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
    return
  }

  if (notification.type === 'all_service_info_filled' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    navigate('/manage-groups', { state: { openGroupId: gId } })
    Promise.all([
      useGroupStore.getState().init({ all: true }),
      useMemberStore.getState().init(),
    ]).finally(() => {
      openHostGroup(gId)
    });
    return
  }

  if (notification.type === 'member_confirmed_service' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    navigate('/manage-groups', { state: { openGroupId: gId } })
    useMemberStore.getState().init().finally(() => {
      openHostGroup(gId)
    });
    return
  }

  if (notification.type === 'group_reviewed' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    navigate('/manage-groups', { state: { openGroupId: gId } })
    openHostGroup(gId)
    return
  }

  if (notification.type === 'service_info_deadline_passed' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    navigate('/manage-groups', { state: { openGroupId: gId } })
    Promise.all([
      useGroupStore.getState().init({ all: true }),
      useMemberStore.getState().init(),
      useApplicationStore.getState().init(),
    ]).finally(() => {
      openHostGroup(gId)
    });
    return
  }

  if (notification.type === 'escrow_released' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    useAuthStore.getState().refreshTokenBalance().catch(console.error);
    navigate('/manage-groups', { state: { openGroupId: gId } })
    useGroupStore.getState().init({ all: true }).finally(() => {
      openHostGroup(gId)
    });
    return
  }

  if (notification.type === 'escrow_released_member' && notification.meta?.groupId) {
    navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId)
    return
  }

  if (notification.type === 'dispute_raised' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    navigate('/manage-groups', { state: { openGroupId: gId, openMemberInfo: true } });
    Promise.all([
      useGroupStore.getState().init({ all: true }),
      useMemberStore.getState().init(),
    ]).finally(() => {
      openHostGroup(gId, { openMemberInfo: true })
    })
    return
  }

  if (notification.type === 'dispute_resolved_by_host' && notification.meta?.groupId) {
    navigateToMemberGroupOrExplore(navigate, userId, notification.meta.groupId);
    return
  }

  if (notification.type === 'dispute_resolved' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    useAuthStore.getState().refreshTokenBalance().catch(console.error);
    const grp = getGroupById(gId);
    if (grp && grp.hostId === userId) {
      navigate('/manage-groups', { state: { openGroupId: gId } })
      Promise.all([
        useGroupStore.getState().init({ all: true }),
        useMemberStore.getState().init(),
      ]).finally(() => {
        openHostGroup(gId)
      })
    } else {
      navigateToMemberGroupOrExplore(navigate, userId, gId);
    }
    return
  }

  if (notification.type === 'group_activated' && notification.meta?.groupId) {
    const gId = notification.meta.groupId
    const grp = getGroupById(gId)
    if (grp && grp.hostId === userId) {
      navigate('/manage-groups', { state: { openGroupId: gId } })
      useGroupStore.getState().init({ all: true }).finally(() => {
        openHostGroup(gId)
      });
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
        openHostGroup(gId)
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
    useAuthStore.getState().refreshTokenBalance().catch(console.error);
    navigate('/explore')
    useGroupStore.getState().init({ all: true })
    return
  }

  const meta = getMeta(notification.type)
  if (!meta.link) return
  navigate(meta.link, meta.state ? { state: meta.state } : undefined)
}
