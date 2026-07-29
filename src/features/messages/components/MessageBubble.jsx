import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useMemberStore } from '../../../shared/stores/useMemberStore'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import { hasFilledServiceInfo, getServiceInfoSummary } from '../../../shared/utils/serviceInfoFields'
import { formatTime } from '../utils'

const getMemberByUserAndGroup = (uid, gid) => useMemberStore.getState().getByUserAndGroup(uid, gid)

function ReadReceipt({ readers }) {
  if (readers.length === 0) return null
  const label = readers.length === 1 ? '已讀' : `${readers.length} 人已讀`
  const tooltip = `已讀：${readers.join('、')}`
  return (
    <span className="group relative inline-flex text-xs leading-normal text-ink-4" tabIndex={0} title={tooltip}>
      <span className="cursor-default">{label}</span>
      <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 w-max max-w-48 rounded-lg bg-ink px-2 py-1 text-xs leading-relaxed text-white opacity-0 shadow-popover transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {tooltip}
      </span>
    </span>
  )
}

export default function MessageBubble({ msg, userId, hostId, groupMembers, conversationGroupId, getMessageSenderName, getReadReceiptNames }) {
  const navigate = useNavigate()

  if (msg.type === 'system') {
    return (
      <div key={msg.id} className="flex justify-center">
        <div className="max-w-xs whitespace-pre-line rounded-2xl bg-raised px-4 py-2 text-center text-xs text-ink-3">
          {msg.text}
        </div>
      </div>
    )
  }
  if (msg.type === 'action') {
    if (msg.visibleTo && !msg.visibleTo.includes(userId)) return null
    if (msg.actionType === 'fill_service_info') {
      const isHost = userId === hostId
      const sharingMethod = getServiceById(msg.payload?.serviceId)?.sharingMethod
      // 純粹顯示大家目前的填寫狀態，不是敏感資料，群組裡每個人都看得到同一份，不用分團主/成員兩種版本
      const myMember = getMemberByUserAndGroup(userId, conversationGroupId)
      const iAlreadyFilled = isHost || (hasFilledServiceInfo(myMember?.serviceInfo, sharingMethod) && !myMember?.serviceInfoIssueNote)
      return (
        <div key={msg.id} className="flex justify-center">
          <div className="w-72 rounded-2xl border border-line bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold text-ink-2">服務帳號填寫進度</p>
            <div className="space-y-2">
              {groupMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-2xs font-black text-white"
                    style={{ background: m.userAvatarColor }}
                  >
                    {m.userAvatarInitial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">{m.userName}</p>
                    {hasFilledServiceInfo(m.serviceInfo, sharingMethod) ? (
                      <p className="text-xs text-ink-3">{getServiceInfoSummary(m.serviceInfo, sharingMethod)}</p>
                    ) : (
                      <p className="text-xs text-ink-4">尚未填寫</p>
                    )}
                  </div>
                  {hasFilledServiceInfo(m.serviceInfo, sharingMethod) && <CheckCircle2 size={13} className="shrink-0 text-success" />}
                </div>
              ))}
            </div>
            {!iAlreadyFilled && (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('pm:close-messages'))
                  navigate('/my-subscriptions', { state: { openGroupId: conversationGroupId } })
                }}
                className="mt-3 w-full rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
              >
                填寫服務帳號
              </button>
            )}
          </div>
        </div>
      )
    }
    if (msg.actionType === 'member_filled_service_info') {
      return (
        <div key={msg.id} className="flex justify-center">
          <p className="rounded-full bg-raised px-3 py-1 text-xs text-ink-3">{msg.text}</p>
        </div>
      )
    }

    if (msg.actionType === 'request_service_resubmit') {
      const svcMember = getMemberByUserAndGroup(userId, conversationGroupId)
      const resubmitSharingMethod = getServiceById(msg.payload?.serviceId)?.sharingMethod
      const alreadyFixed = hasFilledServiceInfo(svcMember?.serviceInfo, resubmitSharingMethod) && !svcMember?.serviceInfoIssueNote
      return (
        <div key={msg.id} className="flex justify-center">
          <div className="w-64 rounded-2xl border border-warning/30 bg-warning-subtle px-4 py-3 text-center shadow-sm">
            <p className="mb-2 text-xs font-semibold text-warning-text">服務帳號需要修正</p>
            {msg.text && <p className="mb-3 rounded-lg bg-white/60 px-3 py-2 text-left text-xs text-ink-2">{msg.text}</p>}
            {alreadyFixed ? (
              <p className="flex items-center justify-center gap-1 text-xs font-semibold text-ink-3">
                <CheckCircle2 size={13} /> 已重新填寫
              </p>
            ) : (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('pm:close-messages'))
                  navigate('/my-subscriptions', { state: { openGroupId: conversationGroupId } })
                }}
                className="w-full rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90"
              >
                重新填寫服務帳號
              </button>
            )}
          </div>
        </div>
      )
    }
    if (msg.actionType === 'all_service_info_filled') {
      return (
        <div key={msg.id} className="flex justify-center">
          <div className="w-64 rounded-2xl border border-success/30 bg-success-subtle px-4 py-3 text-center shadow-sm">
            <p className="mb-2 text-xs text-ink-2">{msg.text}</p>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('pm:close-messages'))
                navigate('/manage-groups', { state: { openGroupId: conversationGroupId, openBilling: true } })
                window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: conversationGroupId, openBilling: true } }))
              }}
              className="w-full rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              前往收款管理
            </button>
          </div>
        </div>
      )
    }
    return null
  }
  const isMine = msg.senderId === userId
  if (isMine) {
    const readReceiptNames = getReadReceiptNames(msg)
    return (
      <div key={msg.id} className="flex justify-end">
        <div className="max-w-[70%]">
          {/* 自己發的訊息不需要再標示自己的名字 */}
          {/* w-fit + ml-auto：避免 Safari 因已讀名單變長（2 人以上）讓 abs 定位 tooltip
              撐大 position:relative 祖先的 intrinsic width，連帶把這個 block div
              的 width:auto 撐寬，在文字後方留下大片空白；ml-auto 確保泡泡縮回文字寬度後
              仍貼齊右側（跟下方時間/已讀那一列一致），不會整個往左移 */}
          <div className="ml-auto w-fit rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-sm text-white">
            {msg.text}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <span className="text-xs leading-normal text-ink-4">{formatTime(msg.createdAt)}</span>
            <ReadReceipt readers={readReceiptNames} />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div key={msg.id} className="flex items-end gap-2">
      <span
        className="mb-6 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black text-white"
        style={{ background: msg.avatarColor ?? '#64748b' }}
      >
        {msg.avatarInitial}
      </span>
      <div className="max-w-[70%]">
        <p className="mb-1 text-xs font-bold text-ink-3">{getMessageSenderName(msg)}</p>
        <div className="w-fit rounded-2xl rounded-tl-md bg-white px-4 py-2.5 text-sm text-ink shadow-sm">
          {msg.text}
        </div>
        <p className="mt-1 text-xs text-ink-4">{formatTime(msg.createdAt)}</p>
      </div>
    </div>
  )
}
