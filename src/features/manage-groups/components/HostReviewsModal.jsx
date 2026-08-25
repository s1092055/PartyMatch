import { Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from '../../../components/ui/dialog'
import HostReviews from '../../group/components/HostReviews'

export function HostReviewsModalBody({ host }) {
  return (
    <div className="px-5">
      <HostReviews
        group={{
          hostId:            host.id,
          hostName:          host.displayName,
          hostAvatarInitial: host.avatarInitial,
          hostAvatarColor:   host.avatarColor,
        }}
        title=""
      />
    </div>
  )
}

export default function HostReviewsModal({ isOpen, onClose, host }) {
  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent maxWidth="max-w-md" height="min(80dvh, 640px)">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Star strokeWidth={1.5} size={16} className="text-brand" />
            <DialogTitle>我的評價</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>我的評價</DialogDescription>
        <DialogBody>
          {isOpen && <HostReviewsModalBody host={host} />}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
