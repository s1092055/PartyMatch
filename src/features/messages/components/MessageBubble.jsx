import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Avatar } from '../../../components/ui/avatar'
import ImageLightbox from '../../../components/ui/ImageLightbox'
import { PresenceDot } from '../../../common/layout/components/navShared'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { hasFilledServiceInfo, getServiceInfoSummary, isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'
import { formatTime } from '../utils'

const getMemberByUserAndGroup = (uid, gid) => useMemberStore.getState().getByUserAndGroup(uid, gid)

function ReadReceipt({ readers }) {
  if (readers.length === 0) return null
  const label = readers.length === 1 ? '已讀' : `${readers.length} 人已讀`
  const tooltip = `已讀：${readers.join('、')}`
  return (
    <span className="group relative inline-flex text-xs leading-normal text-ink-4" tabIndex={0} title={tooltip}>
      <span className="cursor-default">{label}</span>
      <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 w-max max-w-48 rounded-lg bg-neutral-900 px-2 py-1 text-xs leading-relaxed text-white opacity-0 shadow-popover transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {tooltip}
      </span>
    </span>
  )
}

function MessageAttachment({ url }) {
  const [open, setOpen] = useState(false)
  if (!url) return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mt-1.5 block">
        <img src={url} alt="附件" className="max-h-48 max-w-48 rounded-xl object-cover" />
      </button>
      {open && <ImageLightbox url={url} onClose={() => setOpen(false)} />}
    </>
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
      const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
      // 純粹顯示大家目前的填寫狀態，不是敏感資料，群組裡每個人都看得到同一份，不用分團主/成員兩種版本
      const myMember = getMemberByUserAndGroup(userId, conversationGroupId)
      const iAlreadyFilled = isHost || (hasFilledServiceInfo(myMember?.serviceInfo, sharingMethod) && !myMember?.serviceInfoIssueNote)
      return (
        <div key={msg.id} className="flex justify-center">
          <div className="w-72 rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold text-ink-2">{isSharedCredentials ? '帳號資訊提取進度' : '服務帳號填寫進度'}</p>
            <div className="space-y-2">
              {groupMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="relative inline-block shrink-0">
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="xs" className="text-2xs" />
                    <PresenceDot status={m.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2 w-2" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">{m.userName}</p>
                    {hasFilledServiceInfo(m.serviceInfo, sharingMethod) ? (
                      <p className="text-xs text-ink-3">{getServiceInfoSummary(m.serviceInfo, sharingMethod)}</p>
                    ) : (
                      <p className="text-xs text-ink-4">{isSharedCredentials ? '尚未提取' : '尚未填寫'}</p>
                    )}
                  </div>
                  {hasFilledServiceInfo(m.serviceInfo, sharingMethod) && <CheckCircle2 size={13} className="shrink-0 text-success" />}
                </div>
              ))}
            </div>
            {!iAlreadyFilled && (
              <Button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('pm:close-messages'))
                  // 有帳號問題（serviceInfoIssueNote）時這顆按鈕也會出現，此時要走 fillInfoCta 開啟
                  // FillServiceInfoModal 讓使用者看到問題原因再重新確認，不能直接跳去帳號資訊分頁
                  // （分頁的提取按鈕只是單純重新呼叫同一個 API，不會顯示問題原因文字）
                  navigate('/my-subscriptions', {
                    state: { openGroupId: conversationGroupId, openCredentials: isSharedCredentials && !myMember?.serviceInfoIssueNote },
                  })
                }}
                className="mt-3 h-auto w-full rounded-lg px-3 py-1.5 text-xs"
              >
                {isSharedCredentials ? '提取帳號資訊' : '填寫服務帳號'}
              </Button>
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
      const resubmitIsSharedCredentials = isSharedCredentialsMethod(resubmitSharingMethod)
      const alreadyFixed = hasFilledServiceInfo(svcMember?.serviceInfo, resubmitSharingMethod) && !svcMember?.serviceInfoIssueNote
      return (
        <div key={msg.id} className="flex justify-center">
          <div className="w-64 rounded-2xl border border-warning/30 bg-warning-subtle px-4 py-3 text-center shadow-sm">
            <p className="mb-2 text-xs font-semibold text-warning-text">服務帳號需要修正</p>
            {msg.text && <p className="mb-3 rounded-lg bg-surface/60 px-3 py-2 text-left text-xs text-ink-2">{msg.text}</p>}
            {alreadyFixed ? (
              <p className="flex items-center justify-center gap-1 text-xs font-semibold text-ink-3">
                <CheckCircle2 size={13} /> {resubmitIsSharedCredentials ? '已重新確認' : '已重新填寫'}
              </p>
            ) : (
              <Button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('pm:close-messages'))
                  navigate('/my-subscriptions', { state: { openGroupId: conversationGroupId } })
                }}
                className="h-auto w-full rounded-lg bg-warning px-3 py-1.5 text-xs hover:bg-warning hover:opacity-90"
              >
                {resubmitIsSharedCredentials ? '重新提取帳號資訊' : '重新填寫服務帳號'}
              </Button>
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
            <Button
              variant="success"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('pm:close-messages'))
                navigate('/manage-groups', { state: { openGroupId: conversationGroupId, openBilling: true } })
                window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: conversationGroupId, openBilling: true } }))
              }}
              className="h-auto w-full rounded-lg px-3 py-1.5 text-xs"
            >
              前往收款管理
            </Button>
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
            <MessageAttachment url={msg.attachmentUrl} />
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
      <span className="relative mb-6 inline-block shrink-0">
        <Avatar initial={msg.avatarInitial} color={msg.avatarColor} size="sm" className="text-xs" />
        <PresenceDot status={msg.presenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
      </span>
      <div className="max-w-[70%]">
        <p className="mb-1 text-xs font-bold text-ink-3">{getMessageSenderName(msg)}</p>
        <div className="w-fit rounded-2xl rounded-tl-md bg-surface px-4 py-2.5 text-sm text-ink shadow-sm">
          {msg.text}
          <MessageAttachment url={msg.attachmentUrl} />
        </div>
        <p className="mt-1 text-xs text-ink-4">{formatTime(msg.createdAt)}</p>
      </div>
    </div>
  )
}
