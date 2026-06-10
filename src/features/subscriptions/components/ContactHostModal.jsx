import { MessageCircle } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Avatar from '../../../shared/components/ui/Avatar'
import Button from '../../../shared/components/ui/Button'

export default function ContactHostModal({ isOpen, onClose, sub }) {
  if (!sub) return null

  function openConversation() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: sub.groupId } }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="聯絡團主"
      titleIcon={<MessageCircle size={16} className="text-brand" />}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 rounded-2xl bg-raised p-4">
          <Avatar initial={sub.hostAvatarInitial} color={sub.hostAvatarColor} size="md" />
          <div className="min-w-0">
            <p className="font-extrabold text-ink">{sub.hostName}</p>
            <p className="text-xs text-ink-3">{sub.serviceName} · {sub.planName} 團主</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          你可以透過群組訊息直接與團主聯繫，討論付款、規則或其他相關問題。
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button variant="primary" size="md" className="w-full" onClick={openConversation}>
            <MessageCircle size={15} />
            開啟群組對話
          </Button>
          <Button variant="secondary" size="md" className="w-full" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </Modal>
  )
}
