import { Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from '../../../components/ui/dialog'
import UserReviews from '../../group/components/UserReviews'

export function UserReviewsModalBody({ user }) {
  return (
    <div className="px-5">
      <UserReviews
        userId={user.id}
        userName={user.displayName}
        avatarInitial={user.avatarInitial}
        avatarColor={user.avatarColor}
        title=""
      />
    </div>
  )
}

export default function UserReviewsModal({ isOpen, onClose, user }) {
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
          {isOpen && <UserReviewsModalBody user={user} />}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
