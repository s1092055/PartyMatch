import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// 附件預覽用的輕量燈箱，不走 Radix Dialog——這個元件是從已經開著的群組詳情 Modal
// 裡面再疊一層，背景捲動早就被最外層的 Dialog 鎖住了，不需要自己管 scroll lock。
// 但 Radix Dialog 開啟時會把 body 設成 pointer-events: none，只把它自己的 Overlay／
// Content 明確設回 auto，藉此把所有互動鎖在 Dialog 裡面；pointer-events 會繼承，
// 我們這個燈箱是掛在 body 底下的另一個 portal（不在 Dialog 的內容樹裡），沒有明確設
// auto 的話會整層都吃不到點擊事件，滑鼠點擊會直接穿透到底下的 Dialog Overlay，
// 造成點擊燈箱背景或關閉鈕時被 Radix 誤判成「點擊 Dialog 外面」而把它也關掉
// caption：選填，疊在圖片底部的說明文字（跟卡片本身同一套漸層遮罩樣式），不傳就是原本
// 純看圖模式；imageClassName：選填，蓋掉預設「盡量撐滿視窗」的尺寸，給不需要放這麼大、
// 只是想放大看清楚細節的情境用（例如首頁卡片縮圖）；onPrev／onNext：選填，有傳才會顯示
// 切換箭頭（多張圖片可切換的情境，例如首頁族群卡片）——桌機/平板貼在螢幕左右兩側，手機版
// 沒有側邊空間，改成一排按鈕排在圖片下方
export default function ImageLightbox({ url, alt, onClose, caption, imageClassName = 'max-h-full max-w-full object-contain', onPrev, onNext }) {
  useEffect(() => {
    // 用 capture 階段攔截並 stopPropagation：Radix Dialog 自己也在 document 上監聽 Escape
    // 準備關閉底下的群組詳情 Modal，capture 階段是由外而內（window 比 document 先收到），
    // 這裡搶在它前面把事件攔下來，才不會一按 Esc 兩層 Modal 一起關掉
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrev?.()
      } else if (e.key === 'ArrowRight') {
        onNext?.()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose, onPrev, onNext])

  return createPortal(
    <div
      data-image-lightbox
      className="pointer-events-auto fixed inset-0 z-[80] flex animate-backdrop-in items-center justify-center bg-black/95 p-4"
      onClick={e => { e.stopPropagation(); onClose() }}
    >
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        aria-label="關閉"
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
      {onPrev && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          aria-label="上一張"
          className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:grid"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
      )}
      {onNext && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          aria-label="下一張"
          className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:grid"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      )}
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <img
            src={url}
            alt={alt ?? '附件'}
            className={`block rounded-2xl ${imageClassName}`}
            onClick={e => e.stopPropagation()}
          />
          {caption && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4">
              {caption}
            </div>
          )}
        </div>
        {(onPrev || onNext) && (
          <div className="flex items-center gap-3 sm:hidden">
            <button
              onClick={e => { e.stopPropagation(); onPrev?.() }}
              aria-label="上一張"
              disabled={!onPrev}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onNext?.() }}
              aria-label="下一張"
              disabled={!onNext}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
