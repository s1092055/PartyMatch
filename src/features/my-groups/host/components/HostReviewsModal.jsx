import { Star } from 'lucide-react'
import Modal from '../../../../shared/ui/primitives/Modal'
import HostReviews from '../../../group/components/HostReviews'

// 「我的評價」：彙總團主名下所有群組的評價，跟群組詳情裡「成員評價」分頁（只看單一群組）分開
export default function HostReviewsModal({ isOpen, onClose, host }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={<Star size={16} className="text-brand" />} sub maxWidth="max-w-md" height="min(80vh, 640px)">
      <div className="px-5">
        <HostReviews
          group={{
            hostId:            host.id,
            hostName:          host.displayName,
            hostAvatarInitial: host.avatarInitial,
            hostAvatarColor:   host.avatarColor,
          }}
          title="我的評價"
          headerClassName="text-lg font-black text-brand"
        />
      </div>
    </Modal>
  )
}
