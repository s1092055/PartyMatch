import { X } from 'lucide-react'

export default function AttachmentPreviewChip({ attachment }) {
  if (!attachment.url) return null
  return (
    <div className="mb-2 flex w-fit items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
      <img src={attachment.url} alt={attachment.name} className="h-8 w-8 shrink-0 rounded-md object-cover" />
      <span className="max-w-32 truncate text-2xs text-ink-2">{attachment.name}</span>
      <button
        type="button"
        onClick={attachment.onRemove}
        aria-label="移除附件"
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-ink-4 transition-colors hover:bg-raised hover:text-ink-2"
      >
        <X size={12} />
      </button>
    </div>
  )
}
