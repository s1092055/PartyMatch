import { useEffect, useState } from 'react'
import { getGroupById } from '../stores/groupStore'
import { getMembersByGroupId } from '../stores/memberStore'
import { getApplicationsByGroupId } from '../stores/applicationStore'
import { getCurrentUser } from '../stores/authStore'
import HostGroupView from '../../features/manage/components/HostGroupView'
import MemberGroupView from '../../features/subscriptions/components/MemberGroupView'

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onConfirmMember, onReportPaymentIssue, onActivate, onActivateGroup, onRemoveMember,
  onMarkPaid, onApprove, onReject, errors,
  autoOpenPayment, autoOpenActivateGroup, autoOpenApplications, autoOpenBilling,
}) {
  const [, setTick] = useState(0)
  useEffect(() => {
    function onGroupsChanged() { setTick(t => t + 1) }
    window.addEventListener('pm:groups-changed', onGroupsChanged)
    return () => window.removeEventListener('pm:groups-changed', onGroupsChanged)
  }, [])

  if (!isOpen || !groupId) return null
  const group = getGroupById(groupId)
  if (!group) return null
  const currentUser  = getCurrentUser()
  const isHost       = currentUser?.id === group.hostId
  const members      = getMembersByGroupId(groupId)
  const applications = isHost ? getApplicationsByGroupId(groupId) : []

  if (isHost) return (
    <HostGroupView
      group={group} members={members} applications={applications}
      onConfirmMember={onConfirmMember} onReportPaymentIssue={onReportPaymentIssue} onRemoveMember={onRemoveMember}
      onActivate={onActivate} onActivateGroup={onActivateGroup}
      onApprove={onApprove} onReject={onReject}
      errors={errors} onClose={onClose}
      autoOpenActivateGroup={autoOpenActivateGroup}
      autoOpenApplications={autoOpenApplications}
      autoOpenBilling={autoOpenBilling}
    />
  )
  return <MemberGroupView group={group} onMarkPaid={onMarkPaid} onClose={onClose} autoOpenPayment={autoOpenPayment} />
}
