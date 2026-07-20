import { Archive } from 'lucide-react'
import Modal from './Modal'
import EmptyState from './EmptyState'

export default function GroupHistoryModal({ isOpen, onClose, items, renderItem, emptyDescription }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="群組紀錄"
      icon={<Archive size={16} className="text-ink-3" />}
      maxWidth="max-w-3xl"
    >
      <div className="p-5">
        {items.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="還沒有已結束的群組"
            description={emptyDescription}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map(renderItem)}
          </div>
        )}
      </div>
    </Modal>
  )
}
