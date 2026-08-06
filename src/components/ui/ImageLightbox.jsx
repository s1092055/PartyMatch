import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// 附件預覽用的輕量燈箱，不走 Radix Dialog——這個元件是從已經開著的群組詳情 Modal
// 裡面再疊一層，背景捲動早就被最外層的 Dialog 鎖住了，不需要自己管 scroll lock。
// 但 Radix Dialog 開啟時會把 body 設成 pointer-events: none，只把它自己的 Overlay／
// Content 明確設回 auto，藉此把所有互動鎖在 Dialog 裡面；pointer-events 會繼承，
// 我們這個燈箱是掛在 body 底下的另一個 portal（不在 Dialog 的內容樹裡），沒有明確設
// auto 的話會整層都吃不到點擊事件，滑鼠點擊會直接穿透到底下的 Dialog Overlay，
// 造成點擊燈箱背景或關閉鈕時被 Radix 誤判成「點擊 Dialog 外面」而把它也關掉
export default function ImageLightbox({ url, alt, onClose }) {
  useEffect(() => {
    // 用 capture 階段攔截並 stopPropagation：Radix Dialog 自己也在 document 上監聽 Escape
    // 準備關閉底下的群組詳情 Modal，capture 階段是由外而內（window 比 document 先收到），
    // 這裡搶在它前面把事件攔下來，才不會一按 Esc 兩層 Modal 一起關掉
    function onKeyDown(e) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return createPortal(
    <div
      data-image-lightbox
      className="pointer-events-auto fixed inset-0 z-[80] flex animate-backdrop-in items-center justify-center bg-black/85 p-4"
      onClick={e => { e.stopPropagation(); onClose() }}
    >
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        aria-label="關閉"
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
      <img
        src={url}
        alt={alt ?? '附件'}
        className="max-h-full max-w-full object-contain"
        onClick={e => e.stopPropagation()}
      />
    </div>,
    document.body,
  )
}
