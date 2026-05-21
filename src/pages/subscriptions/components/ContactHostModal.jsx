import { MessageCircle } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Avatar from '../../../shared/components/ui/Avatar'

export default function ContactHostModal({ isOpen, onClose, sub }) {
  if (!sub) return null
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
          目前尚未提供即時聊天功能。你可以前往群組詳情頁留言，或等待團主主動聯繫。
        </p>
        <p className="mt-2 text-sm text-ink-3">
          如有付款相關問題，請先點擊「標記已付款」，待團主確認後即完成本期付款。
        </p>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
        >
          關閉
        </button>
      </div>
    </Modal>
  )
}
