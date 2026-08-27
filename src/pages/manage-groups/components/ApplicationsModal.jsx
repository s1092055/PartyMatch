import { ClipboardList } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import ApplicationsTab from './ApplicationsTab'

export default function ApplicationsModal({ isOpen, onClose, applications, seatMap, errors, onApprove, onReject }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="全部申請紀錄"
      titleIcon={<ClipboardList size={16} className="text-amber-500" />}
      maxWidth="max-w-2xl"
    >
      <div className="max-h-[70vh] overflow-y-auto p-5">
        <ApplicationsTab
          applications={applications}
          seatMap={seatMap}
          errors={errors}
          onApprove={onApprove}
          onReject={onReject}
        />
      </div>
    </Modal>
  )
}
