import { getGroupById } from '../stores/groupStore'
import { getMembersByGroupId } from '../stores/memberStore'
import { getApplicationsByGroupId } from '../stores/applicationStore'
import { getCurrentUser } from '../stores/authStore'
import HostGroupView from '../../features/manage/components/HostGroupView'
import MemberGroupView from '../../features/subscriptions/components/MemberGroupView'

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onConfirmMember, onActivate, onActivateGroup, onRemoveMember,
  onMarkPaid, onApprove, onReject, errors,
}) {
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
      onConfirmMember={onConfirmMember} onRemoveMember={onRemoveMember}
      onActivate={onActivate} onActivateGroup={onActivateGroup}
      onApprove={onApprove} onReject={onReject}
      errors={errors} onClose={onClose}
    />
  )
  return <MemberGroupView group={group} onMarkPaid={onMarkPaid} onClose={onClose} />
}
