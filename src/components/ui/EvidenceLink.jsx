import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import ImageLightbox from './ImageLightbox'
import { isImageUrl } from '../../common/utils/fileUtils'

// 「查看附件」共用連結：圖片用燈箱在頁面內直接開，不是新分頁；非圖片檔案（例如附件其實
// 是別種格式）沒辦法內嵌預覽，還是開新分頁交給瀏覽器自己處理
export default function EvidenceLink({ url, className }) {
  const [open, setOpen] = useState(false)
  if (!url) return null

  if (!isImageUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={className}>
        <Paperclip size={11} /> 查看附件
      </a>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Paperclip size={11} /> 查看附件
      </button>
      {open && <ImageLightbox url={url} onClose={() => setOpen(false)} />}
    </>
  )
}
