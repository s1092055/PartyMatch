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
        aria-label="新增附件"
        className={className}
      >
        <Paperclip size={15} strokeWidth={1.5} />
      </button>
    </>
  )
}
