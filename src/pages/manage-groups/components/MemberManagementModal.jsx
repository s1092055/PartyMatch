import { Users } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import MemberManagementPanel from './MemberManagementPanel'

export default function MemberManagementModal({ isOpen, onClose, group, members, onRemove }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`成員管理 · ${group?.serviceName ?? ''}`}
      titleIcon={<Users size={16} className="text-brand" />}
      maxWidth="max-w-2xl"
    >
      <div className="max-h-[70vh] overflow-y-auto p-5">
        <MemberManagementPanel
          members={members}
          focusGroupId={group?.id}
          groups={group ? [group] : []}
          onRemove={onRemove}
        />
      </div>
    </Modal>
  )
}
