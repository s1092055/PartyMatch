import { FileText, Paperclip, X } from 'lucide-react'
import { isImageUrl } from '../../common/utils/fileUtils'

export default function EvidenceAttachmentField({ label = '附件說明（選填）', url, name, uploading, onSelect, onRemove }) {
  return (
    <div>
      <label className="block text-xs text-ink-3 mb-1.5">{label}</label>
      {url ? (
        <div className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5">
          {isImageUrl(url) ? (
            <img src={url} alt={name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          ) : (
            <FileText strokeWidth={1.5} size={20} className="shrink-0 text-ink-3" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{name || '附件'}</span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="移除附件"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-4 transition-colors hover:bg-raised hover:text-ink-2"
          >
            <X strokeWidth={1.5} size={14} />
          </button>
        </div>
      ) : (
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink-3 transition-colors hover:border-brand/40 hover:text-brand">
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/heic" onChange={onSelect} className="hidden" disabled={uploading} />
          <Paperclip strokeWidth={1.5} size={16} />
          {uploading ? '上傳中…' : '新增附件'}
        </label>
      )}
    </div>
  )
}
