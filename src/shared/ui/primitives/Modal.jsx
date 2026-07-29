import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, X } from 'lucide-react'
import { useScrollLock } from '../../utils/hooks'

export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  headerEnd,
  footer,
  maxWidth,
  height,
  outerPadding = 'p-4 md:p-8',
  sub = false,
  instantEntry = false,
  hideClose = false,
  hideBack = false,
  closeIcon = 'back', // sub 模式的關閉按鈕樣式：'back'（左上角返回箭頭，預設）或 'x'（右上角 X，跟一般 Modal 一致）
  headerBorder = true,
  showHeader = true,
  children,
}) {
  const resolvedMaxWidth = maxWidth ?? (sub ? 'max-w-md' : 'max-w-5xl')
  const controlled = isOpen !== undefined

  const [shouldRender, setShouldRender] = useState(controlled ? !!isOpen : true)
  // isOpen 變 true 的當下要立刻算進來，不能只靠下面那個 effect 才把 shouldRender 設成 true——
  // effect 要等這一輪 render/commit 完、瀏覽器可能已經畫出畫面之後才會執行，中間會多出一個
  // 「shouldRender 還是舊的 false」的畫面，這個 modal 什麼都不畫、useScrollLock 也還沒鎖上，
  // 如果剛好是底下的群組詳情 modal 同一時間卸載消失的情境（見 instantEntry 的用法），
  // 就會在這一瞬間看到捲軸跳出來、畫面閃一下
  const isVisible = controlled ? (isOpen || shouldRender) : shouldRender

  useScrollLock(isVisible)

  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!controlled) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setShouldRender(true)
    else setShouldRender(false)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sub) return
    function onKeyDown(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sub]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (controlled) {
      onCloseRef.current?.()
    } else {
      setShouldRender(false)
      onCloseRef.current?.()
    }
  }

  if (!isVisible) return null

  if (sub) {
    return createPortal(
      <div className={`fixed inset-0 z-[65] flex items-center justify-center ${outerPadding}`}>
        {/* instantEntry：用在「開啟這個 sub-modal 的同時，底下的群組詳情 modal 剛好整個卸載消失」的情境
            （見 HostGroupView.jsx／MemberGroupView.jsx 的 hide-parent 模式）——遮罩跟內容都不能有進場動畫，
            不然底下頁面會在兩層遮罩交接的瞬間閃一下沒有變暗的畫面，或內容縮放淡入跟父層瞬間消失對不上顯得突兀；
            真正疊在還看得到的父層 modal 上面時（例如 RenewalModal、ReviewHostModal），維持原本的淡入動畫 */}
        <div
          className={`absolute inset-0 cursor-pointer bg-black/50 ${instantEntry ? '' : 'animate-backdrop-in'}`}
          onClick={handleClose}
        />
        <div
          className={`relative flex w-full flex-col ${resolvedMaxWidth} card overflow-hidden p-0 ${instantEntry ? '' : 'animate-modal-in'}`}
          style={height ? { height, maxHeight: 'calc(100dvh - 2rem)' } : { maxHeight: 'calc(100dvh - 2rem)' }}
        >
          {showHeader && (title || icon) && (
            <div className="flex items-center border-b border-line-subtle px-3 py-3">
              {closeIcon === 'x' ? (
                <div className="w-1 shrink-0" />
              ) : hideBack ? (
                <div className="h-9 w-9 shrink-0" />
              ) : (
                <button onClick={handleClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70">
                  <ChevronLeft size={20} strokeWidth={1.5} />
                </button>
              )}
              <div className={`flex min-w-0 flex-1 items-center gap-2 ${closeIcon === 'x' ? 'pl-2' : 'px-1'}`}>
                {icon}
                {title && <h2 className="truncate text-base font-extrabold text-ink">{title}</h2>}
              </div>
              {headerEnd && <div className="shrink-0">{headerEnd}</div>}
              {closeIcon === 'x' && (
                <button onClick={handleClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70" aria-label="關閉">
                  <X size={18} />
                </button>
              )}
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
          {footer && <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[55] cursor-pointer bg-black/50 animate-backdrop-in"
        onClick={handleClose}
      />
      <div className={`pointer-events-none fixed inset-0 z-[56] flex items-center justify-center ${outerPadding}`}>
        <div
          className={`pointer-events-auto flex w-full ${resolvedMaxWidth} flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-modal-in`}
          style={height ? { height } : undefined}
        >
          {showHeader && (
          <div className={`flex shrink-0 items-center justify-between px-6 py-5 ${headerBorder ? 'border-b border-line' : ''}`}>
            <div className="flex items-center gap-2">
              {icon}
              {title && <h2 className="text-lg font-extrabold text-ink">{title}</h2>}
            </div>
            <div className="flex items-center gap-1">
              {headerEnd}
              <button onClick={handleClose} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70 ${hideClose ? 'max-md:hidden' : ''}`} aria-label="關閉">
                <X size={18} />
              </button>
            </div>
          </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
          {footer && <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      </div>
    </>,
    document.body
  )
}
