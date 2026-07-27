import { AlertTriangle } from 'lucide-react'
import Modal from '../../../../shared/ui/primitives/Modal'
import EvidenceAttachmentField from '../../../../shared/ui/EvidenceAttachmentField'

const DISPUTE_REASON_OPTIONS = [
  '服務帳號未提供或有誤',
  '服務尚未啟用',
  '服務品質與描述不符',
  '團主已讀不回、無法聯繫',
  '帳號被團主收回或更改密碼',
  '其他',
]

// 回報問題（文案上不強調「向平台申訴」，改成更平易近人的「回報給團主」框架，機制不變：
// 後端還是走原本的申訴/裁定流程，只是還沒有正式服務中心可以受理，先用這個說法）改成堆疊在
// 群組詳情 Modal 上方的 sub-modal，跟「填寫服務帳號」同一套模式——開啟時底下的群組詳情完全隱藏，關閉才恢復顯示
export default function DisputeModal({
  isOpen,
  onClose,
  onSubmit,
  disputeReasons,
  onToggleReason,
  disputeDetail,
  setDisputeDetail,
  disputeLoading,
  evidenceUrl,
  evidenceName,
  evidenceUploading,
  onEvidenceSelect,
  onRemoveEvidence,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="回報問題"
      icon={<AlertTriangle size={18} className="text-danger" />}
      maxWidth="max-w-lg"
      sub
      instantEntry
      closeIcon="x"
      footer={
        <button
          type="submit"
          form="dispute-form"
          disabled={disputeReasons.length === 0 || disputeLoading || evidenceUploading}
          className="w-full rounded-xl bg-danger py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
        >
          {disputeLoading ? '送出中…' : '送出回報'}
        </button>
      }
    >
      <form id="dispute-form" onSubmit={onSubmit} className="animate-step-slide-up p-5 space-y-4">
        <div>
          <label className="block text-xs text-ink-3 mb-1.5">回報原因 <span className="text-danger">*</span>（可複選）</label>
          <div className="space-y-1.5">
            {DISPUTE_REASON_OPTIONS.map(option => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2 text-sm text-ink-2 transition-colors hover:border-brand/40"
              >
                <input
                  type="checkbox"
                  checked={disputeReasons.includes(option)}
                  onChange={() => onToggleReason(option)}
                  className="h-4 w-4 shrink-0 accent-danger"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-3 mb-1.5">補充說明（選填）</label>
          <textarea
            value={disputeDetail}
            onChange={e => setDisputeDetail(e.target.value)}
            placeholder="請描述服務未正常啟用的具體情況..."
            rows={4}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none resize-none"
          />
        </div>
        <EvidenceAttachmentField
          url={evidenceUrl}
          name={evidenceName}
          uploading={evidenceUploading}
          onSelect={onEvidenceSelect}
          onRemove={onRemoveEvidence}
        />
        <div className="rounded-lg bg-warning-subtle px-3 py-2.5 text-sm text-warning-text">
          <p className="font-semibold mb-1">回報須知</p>
          <p>送出後代管金額會先凍結，將於 48 小時內處理完成。請詳細說明問題，方便盡快確認狀況。</p>
        </div>
      </form>
    </Modal>
  )
}
