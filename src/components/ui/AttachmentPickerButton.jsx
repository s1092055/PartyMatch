import { useRef } from 'react'
import { Paperclip } from 'lucide-react'

export default function AttachmentPickerButton({ attachment, className }) {
  const fileInputRef = useRef(null)
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/heic"
        onChange={attachment.onSelect}
        className="hidden"
        disabled={attachment.uploading}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={attachment.uploading}
        aria-label={attachment.uploading ? `上傳中 ${attachment.progress}%` : '新增附件'}
        className={className}
      >
        {attachment.uploading
          ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          : <Paperclip size={15} strokeWidth={1.5} />}
      </button>
    </>
  )
}
