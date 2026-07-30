import { Dialog as DialogPrimitive } from "radix-ui"
import { ChevronLeft, X } from 'lucide-react'
import { cn } from "../../lib/utils"

// 本專案有兩種 Dialog 視覺：
// - default：一般置中對話框（rounded-2xl、z-56、右上角 X）
// - panel：次層對話框（card 樣式、z-65、左上角返回箭頭或 X，用在「從另一個
//   Dialog 換頁」的情境，例如群組詳情 → 啟用服務）
const VARIANT_CONTENT = {
  default: 'max-w-5xl rounded-2xl bg-canvas shadow-2xl',
  panel:   'max-w-md card p-0',
}
const VARIANT_Z = { default: 'z-[56]', panel: 'z-[65]' }

export function Dialog(props) {
  return <DialogPrimitive.Root {...props} />
}

function DialogPortal(props) {
  return <DialogPrimitive.Portal {...props} />
}

export function DialogClose(props) {
  return <DialogPrimitive.Close {...props} />
}

function DialogOverlay({ className, variant = 'default', instant, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn('fixed inset-0 cursor-pointer bg-black/50', VARIANT_Z[variant], !instant && 'animate-backdrop-in', className)}
      {...props}
    />
  )
}

export function DialogContent({ className, variant = 'default', maxWidth, height, outerPadding = 'p-4 md:p-8', instant, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay variant={variant} instant={instant} />
      <div className={cn('fixed inset-0 flex items-center justify-center', VARIANT_Z[variant], outerPadding)}>
        <DialogPrimitive.Content
          className={cn(
            'flex w-full flex-col overflow-hidden',
            !instant && 'animate-modal-in',
            VARIANT_CONTENT[variant],
            maxWidth,
            className
          )}
          style={height ? { height, ...(variant === 'panel' ? { maxHeight: 'calc(100dvh - 2rem)' } : {}) } : (variant === 'panel' ? { maxHeight: 'calc(100dvh - 2rem)' } : undefined)}
          {...props}
        />
      </div>
    </DialogPortal>
  )
}

export function DialogHeader({ className, variant = 'default', border = true, ...props }) {
  const base = variant === 'panel'
    ? 'flex items-center px-3 py-3'
    : 'flex shrink-0 items-center justify-between px-6 py-5'
  const borderCls = variant === 'panel' ? 'border-b border-line-subtle' : 'border-b border-line'
  return <div className={cn(base, border && borderCls, className)} {...props} />
}

export function DialogTitle({ className, variant = 'default', ...props }) {
  const base = variant === 'panel' ? 'truncate text-base font-extrabold text-ink' : 'text-lg font-extrabold text-ink'
  return <DialogPrimitive.Title className={cn(base, className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <DialogPrimitive.Description className={cn('sr-only', className)} {...props} />
}

export function DialogBody({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      {...props}
    />
  )
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('flex shrink-0 gap-3 border-t border-line px-6 py-4', className)} {...props} />
}

export function DialogCloseButton({ className, ...props }) {
  return (
    <DialogPrimitive.Close asChild>
      <button
        aria-label="關閉"
        className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70', className)}
        {...props}
      >
        <X size={18} />
      </button>
    </DialogPrimitive.Close>
  )
}

export function DialogBackButton({ className, ...props }) {
  return (
    <DialogPrimitive.Close asChild>
      <button
        aria-label="返回"
        className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:opacity-70', className)}
        {...props}
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
      </button>
    </DialogPrimitive.Close>
  )
}
