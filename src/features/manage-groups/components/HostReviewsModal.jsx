import { Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from '../../../components/ui/dialog'
import HostReviews from '../../group/components/HostReviews'

export default function HostReviewsModal({ isOpen, onClose, host }) {
  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent maxWidth="max-w-md" height="min(80dvh, 640px)">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-brand" />
            <DialogTitle>我的評價</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>我的評價</DialogDescription>
        <DialogBody>
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
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
