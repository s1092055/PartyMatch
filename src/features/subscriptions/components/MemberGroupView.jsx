import { useState } from 'react'
import {
  CheckCircle2, LogOut, MessageCircle, Shield, Users,
} from 'lucide-react'
import Avatar from '../../../shared/ui/Avatar'
import CountdownConfirmDialog from '../../../shared/ui/CountdownConfirmDialog'
import GroupModalShell from '../../../shared/ui/GroupModalShell'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import { useMemberStore } from '../../../shared/stores/useMemberStore'
import { useGroupStore } from '../../../shared/stores/useGroupStore'
import { useSubscriptionStore } from '../../../shared/stores/useSubscriptionStore'
import { useAuthStore } from '../../../shared/stores/useAuthStore'

export default function MemberGroupView({ group, onLeaveGroup, onClose }) {
  const [activePanel, setActivePanel] = useState(null) // 'members' | null
  const [leaveConfirm, setLeaveConfirm] = useState(false)

  const currentUser = useAuthStore(s => s.user)
  const allMembers  = useMemberStore(s => s.members)
  const subscriptions = useSubscriptionStore(s => s.subscriptions)
  const members     = allMembers.filter(m => m.groupId === group.id)
  const sub         = currentUser ? (subscriptions.find(s => s.userId === currentUser.id && s.groupId === group.id) ?? null) : null
  const myMember    = currentUser ? members.find(m => m.userId === currentUser.id) ?? null : null

  const serviceDef        = getServiceById(group.serviceId)
  const planDef           = serviceDef?.plans.find(p => p.name === group.planName)
  const isPaymentRelevant = !['recruiting', 'full'].includes(group.status)

  const hasServiceInfoIssue = !!myMember?.serviceInfoIssueNote
  const hasServiceInfo      = !!myMember?.serviceInfo?.email && !hasServiceInfoIssue
  const needsFillInfo       = !!sub && isPaymentRelevant && !hasServiceInfo
  const canLeaveGroup       = ['recruiting', 'full'].includes(group.status) && !!myMember

  function openMessages() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
  }

  function buildSubPanel() {
    if (activePanel === 'members') {
      return {
        title: '成員名單',
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
                  onClick={() => {
                    setActivePanel(null)
                    onClose()
                    window.dispatchEvent(new CustomEvent('pm:open-dm', {
                      detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor },
                    }))
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
            </div>
            {members.filter(m => m.userId !== currentUser?.id).map(m => (
              <div key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
                  </div>
                  <button
                    onClick={() => {
                      setActivePanel(null)
                      onClose()
                      window.dispatchEvent(new CustomEvent('pm:open-dm', {
                        detail: { hostId: m.userId, hostName: m.userName, hostAvatarInitial: m.userAvatarInitial, hostAvatarColor: m.userAvatarColor },
                      }))
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
                  >
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>
            ))}
            {myMember && (
              <div className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={myMember.userAvatarInitial} color={myMember.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {myMember.userName}
                      <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>
                    </p>
                    <p className="text-xs text-ink-3">{myMember.joinedAt} 加入</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ),
      }
    }

    return null
  }

  return (
    <>
    <GroupModalShell
      onClose={onClose}
      group={group}
      service={serviceDef}
      plan={planDef}
      hideRecruitBar
      headerBanner={hasServiceInfoIssue ? (
        <div className="flex items-center justify-center bg-warning-subtle px-6 py-3 text-sm font-extrabold text-warning-text">
          服務帳號有問題，需要修正
        </div>
      ) : needsFillInfo ? (
        <div className="flex items-center justify-center bg-brand-subtle px-6 py-3 text-sm font-extrabold text-brand">
          請填寫服務帳號以完成加入流程
        </div>
      ) : undefined}
      extraInfoRows={[]}
      statusBadgeOverride={group.status === 'recruiting' && !!sub ? 'member_joined' : undefined}
      pendingBadge={
        hasServiceInfoIssue ? '服務帳號需要修正' :
        needsFillInfo     ? '請填寫服務帳號以完成加入流程' :
        group.status === 'full' && !!sub ? '招募完成，等待團主啟用群組' :
        group.status === 'recruiting' && !!sub ? '已通過申請，需等待其他人加入' :
        undefined
      }
      pendingBadgeColor={
        (['recruiting', 'full'].includes(group.status) && !!sub) ? 'success' :
        hasServiceInfoIssue ? 'danger' :
        undefined
      }
      bottomBar={(() => {
        const btnCount = 1 + (isPaymentRelevant ? 1 : 0) + (canLeaveGroup ? 1 : 0)
        return (
          <div className={`grid grid-cols-${btnCount} gap-1 p-2`}>
            <button
              onClick={() => setActivePanel('members')}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
            >
              <Users size={17} /> 成員名單
            </button>
            {isPaymentRelevant && (
              <button
                onClick={openMessages}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
              >
                <MessageCircle size={17} /> 群組訊息
              </button>
            )}
            {canLeaveGroup && (
              <button
                onClick={() => setLeaveConfirm(true)}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-danger transition-colors hover:bg-red-50"
              >
                <LogOut size={17} /> 退出群組
              </button>
            )}
          </div>
        )
      })()}
      subPanel={activePanel ? buildSubPanel() : null}
      onSubPanelBack={() => setActivePanel(null)}
    >
    </GroupModalShell>

    {leaveConfirm && (
      <CountdownConfirmDialog
        title="退出群組"
        message={`確定要退出「${group.serviceName}」群組嗎？退出後名額將釋出，若要再加入需要重新提出申請。`}
        confirmLabel="退出"
        danger
        onConfirm={() => { setLeaveConfirm(false); onLeaveGroup?.() }}
        onCancel={() => setLeaveConfirm(false)}
      />
    )}

  </>
  )
}
