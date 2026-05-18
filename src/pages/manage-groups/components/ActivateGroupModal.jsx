import Modal from '../../../shared/components/ui/Modal'

export default function ActivateGroupModal({ group, onClose, onConfirm }) {
  return (
    <Modal isOpen onClose={onClose} title="確認啟用服務？" maxWidth="max-w-sm">
      <div className="p-5">
        <p className="text-sm font-semibold text-ink">{group.serviceName} · {group.planName}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
          <li>· 啟用後將開始計算續費日期</li>
          <li>· 方案資訊（價格、人數、週期）將無法修改</li>
          <li>· 已付款成員將收到啟用通知</li>
        </ul>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            確認啟用
          </button>
        </div>
      </div>
    </Modal>
  )
}
