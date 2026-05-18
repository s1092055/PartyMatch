import Modal from '../../../shared/components/ui/Modal'

const CONFIRM_ACTION_CONFIG = {
  pause: {
    title:    '暫停招募',
    desc:     '暫停招募後，不會再接受新的加入申請，現有成員不受影響。',
    btnLabel: '確認暫停',
    btnClass: 'bg-amber-500 hover:bg-amber-600',
  },
  cancel: {
    title:    '解散群組',
    desc:     '解散群組後，所有成員將被移除。此操作在正式版中無法復原，請謹慎操作。',
    btnLabel: '確認解散',
    btnClass: 'bg-danger hover:bg-red-700',
  },
  stop: {
    title:    '停止服務',
    desc:     '停止服務後，本期仍可使用至到期日，下期將不再續訂。此操作無法復原，請謹慎操作。',
    btnLabel: '確認停止',
    btnClass: 'bg-danger hover:bg-red-700',
  },
}

export default function ConfirmActionModal({ action, onClose, onConfirm }) {
  const config = CONFIRM_ACTION_CONFIG[action.type]
  return (
    <Modal isOpen onClose={onClose} title={config.title} maxWidth="max-w-sm">
      <div className="p-5">
        <p className="text-sm leading-relaxed text-ink-2">{config.desc}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${config.btnClass}`}
          >
            {config.btnLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
