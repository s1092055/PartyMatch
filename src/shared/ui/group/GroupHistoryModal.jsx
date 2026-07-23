import { Archive } from 'lucide-react'
import Modal from '../primitives/Modal'
import EmptyState from '../primitives/EmptyState'

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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-3">
            {items.map(renderItem)}
          </div>
        )}
      </div>
    </Modal>
  )
}
