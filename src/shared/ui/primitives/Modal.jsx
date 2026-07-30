import { Dialog } from "radix-ui"
import { ChevronLeft, X } from 'lucide-react'
import { cn } from "../../../lib/utils"

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
  // isOpen 沒傳代表父層本身就是靠條件渲染掛載/卸載這個 Modal（見呼叫端如
  // Step1Service.jsx 的 {infoService && <Modal ...>}），視同一直開著
  const open = isOpen ?? true

  function handleClose() {
    onClose?.()
  }

  // Dialog.Content 用 flex 置中整個視窗（含 outerPadding 的呼吸空間），
  // 點擊真的點在 Content 本身（不是內層的視覺方塊）才視為點了背景關閉；
  // Radix 內建的「點擊外部自動關閉」判斷的是「有沒有點在 Content 之外」，
  // 但 Content 本身就蓋滿全螢幕，用內建判斷永遠不會觸發，所以才要自己比對
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) handleClose()
  }

  const a11yLabel = title || '對話框'

  if (sub) {
    return (
      <Dialog.Root open={open} onOpenChange={v => { if (!v) handleClose() }}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn('fixed inset-0 z-[65] bg-black/50', !instantEntry && 'animate-backdrop-in')}
          />
          <Dialog.Content
            onEscapeKeyDown={e => e.preventDefault()}
            onClick={handleBackdropClick}
            className={cn('fixed inset-0 z-[65] flex cursor-pointer items-center justify-center', outerPadding)}
          >
            <Dialog.Title className="sr-only">{a11yLabel}</Dialog.Title>
            <Dialog.Description className="sr-only">{a11yLabel}</Dialog.Description>
            <div
              className={cn(
                'relative flex w-full cursor-auto flex-col card overflow-hidden p-0',
                resolvedMaxWidth,
                !instantEntry && 'animate-modal-in'
              )}
              style={{ height, maxHeight: 'calc(100dvh - 2rem)' }}
            >
              {showHeader && (title || icon) && (
                <div className="flex items-center border-b border-line-subtle px-3 py-3">
                  {closeIcon === 'x' ? (
                    <div className="w-1 shrink-0" />
                  ) : hideBack ? (
                    <div className="h-9 w-9 shrink-0" />
                  ) : (
                    <Dialog.Close asChild>
                      <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70">
                        <ChevronLeft size={20} strokeWidth={1.5} />
                      </button>
                    </Dialog.Close>
                  )}
                  <div className={cn('flex min-w-0 flex-1 items-center gap-2', closeIcon === 'x' ? 'pl-2' : 'px-1')}>
                    {icon}
                    {title && <h2 className="truncate text-base font-extrabold text-ink">{title}</h2>}
                  </div>
                  {headerEnd && <div className="shrink-0">{headerEnd}</div>}
                  {closeIcon === 'x' && (
                    <Dialog.Close asChild>
                      <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70" aria-label="關閉">
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  )}
                </div>
              )}
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
              {footer && <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">{footer}</div>}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[55] bg-black/50 animate-backdrop-in" />
        <Dialog.Content
          onClick={handleBackdropClick}
          className={cn('fixed inset-0 z-[56] flex cursor-pointer items-center justify-center', outerPadding)}
        >
          <Dialog.Title className="sr-only">{a11yLabel}</Dialog.Title>
          <Dialog.Description className="sr-only">{a11yLabel}</Dialog.Description>
          <div
            className={cn('flex w-full cursor-auto flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-modal-in', resolvedMaxWidth)}
            style={height ? { height } : undefined}
          >
            {showHeader && (
              <div className={cn('flex shrink-0 items-center justify-between px-6 py-5', headerBorder && 'border-b border-line')}>
                <div className="flex items-center gap-2">
                  {icon}
                  {title && <h2 className="text-lg font-extrabold text-ink">{title}</h2>}
                </div>
                <div className="flex items-center gap-1">
                  {headerEnd}
                  <Dialog.Close asChild>
                    <button className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70', hideClose && 'max-md:hidden')} aria-label="關閉">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
            {footer && <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">{footer}</div>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
