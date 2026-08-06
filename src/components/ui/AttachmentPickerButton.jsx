import { useRef } from 'react'
import { Paperclip } from 'lucide-react'

// 隱藏 file input + 觸發按鈕，跟 useEvidenceUpload 搭配使用；留言區／聊天室輸入列共用，
// 只有按鈕外觀（圓角、hover 底色）不同，用 className 客製化
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
