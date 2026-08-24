import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import ImageLightbox from './ImageLightbox'
import { isImageUrl } from '../../common/utils/fileUtils'

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
