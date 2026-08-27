import { useState } from 'react'
import { CheckCircle2, Calendar, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { createMember } from '../../stores/memberStore'
import { createSubscription } from '../../stores/subscriptionStore'
import { updateGroup } from '../../stores/groupStore'
import { createNotification } from '../../stores/notificationStore'
import { getActiveUserProfile } from '../../stores/userStore'

export default function InstantJoinModal({ group, isOpen, onClose, onSuccess }) {
  const navigate = useNavigate()
  const [joined, setJoined] = useState(false)

  function handleConfirm() {
    const activeUser = getActiveUserProfile()
    if (!activeUser) return

    createMember({
      groupId: group.id,
      groupName: group.serviceName,
      userId: activeUser.id,
      userName: activeUser.displayName,
      userAvatarInitial: activeUser.avatarInitial,
      userAvatarColor: activeUser.avatarColor,
    })

    createSubscription({
      groupId: group.id,
      serviceId: group.serviceId,
      serviceName: group.serviceName,
      planName: group.planName,
      hostName: group.hostName,
      hostAvatarInitial: group.hostAvatarInitial,
      hostAvatarColor: group.hostAvatarColor,
      pricePerSeat: group.pricePerSeat,
      billingCycle: group.billingCycle,
      nextBillingDate: group.nextBillingDate,
    })

    updateGroup(group.id, {
      usedSeats: group.usedSeats + 1,
      openSeats: group.openSeats - 1,
    })

    createNotification({
      userId: activeUser.id,
      type: 'joined',
      title: '成功加入群組',
      message: `你已成功加入 ${group.serviceName} 群組，每月費用 NT$${group.pricePerSeat}。`,
    })

    setJoined(true)
    onSuccess?.()
  }

  function handleClose() {
    setJoined(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen && !!group}
      onClose={handleClose}
      title="立即加入群組"
      titleIcon={<Zap size={16} className="text-brand" />}
    >
      {joined ? (
        <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-success-subtle flex items-center justify-center">
            <CheckCircle2 size={28} className="text-success" />
          </div>
          <p className="text-base font-bold text-ink">成功加入！</p>
          <p className="text-sm text-ink-3">
            你已成功加入 {group.serviceName}，<br />可前往「我的訂閱」查看詳情。
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" size="md" className="border border-line" onClick={handleClose}>
              繼續瀏覽
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => { handleClose(); navigate('/my-subscriptions') }}
            >
              前往我的訂閱
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-5 pt-5 pb-4 flex flex-col gap-4">
          {/* Summary rows */}
          <div className="bg-canvas rounded-lg border border-line-subtle divide-y divide-line-subtle">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-ink-3">服務</span>
              <span className="text-sm font-semibold text-ink">{group.serviceName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-ink-3">方案</span>
              <span className="text-sm text-ink-2">{group.planName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-ink-3">每月費用</span>
              <span className="text-sm font-bold text-brand">NT${group.pricePerSeat}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-ink-3 flex items-center gap-1">
                <Calendar size={11} />
                下次扣款日
              </span>
              <span className="text-sm text-ink-2">{group.nextBillingDate}</span>
            </div>
          </div>

          <p className="text-xs text-ink-3 text-center">
            確認後將立即加入，訂閱紀錄會出現在「我的訂閱」頁面。
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="ghost" size="md" className="flex-1 border border-line" onClick={handleClose}>
              取消
            </Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleConfirm}>
              確認加入
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
