import { FileText, Paperclip, X } from 'lucide-react'
import { isImageUrl } from '../../common/utils/fileUtils'

// 附件選擇/預覽欄位：回報問題（DisputeModal）、回報帳號問題（ReportServiceIssueModal）
// 兩邊的「附件說明」區塊是同一套 UI，抽出來避免重複維護
export default function EvidenceAttachmentField({ label = '附件說明（選填）', url, name, uploading, onSelect, onRemove }) {
  return (
    <div>
      <label className="block text-xs text-ink-3 mb-1.5">{label}</label>
      {url ? (
        <div className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5">
          {isImageUrl(url) ? (
            <img src={url} alt={name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          ) : (
            <FileText size={20} className="shrink-0 text-ink-3" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{name || '附件'}</span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="移除附件"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-4 transition-colors hover:bg-raised hover:text-ink-2"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink-3 transition-colors hover:border-brand/40 hover:text-brand">
          <input type="file" onChange={onSelect} className="hidden" disabled={uploading} />
          <Paperclip size={16} />
          {uploading ? '上傳中…' : '新增附件'}
        </label>
      )}
    </div>
  )
}
