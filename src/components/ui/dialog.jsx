import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from 'lucide-react'
import { cn } from "../../lib/utils"
import { Button } from "./button"

// 本專案有兩種 Dialog 視覺：
// - default：一般置中對話框（rounded-2xl、z-56、右上角 X）
// - panel：次層對話框（card 樣式、z-65、左上角返回箭頭或 X，用在「從另一個
//   Dialog 換頁」的情境，例如群組詳情 → 啟用服務）
const VARIANT_CONTENT = {
  default: 'max-w-5xl rounded-2xl border border-line bg-canvas shadow-2xl',
  panel:   'max-w-md rounded-card border border-line bg-surface shadow-card p-0',
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
      className={cn('fixed inset-0 cursor-pointer bg-black/80', VARIANT_Z[variant], !instant && 'animate-backdrop-in', className)}
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

export function DialogHeader({ className, border = true, ...props }) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-between px-6 py-5', border && 'border-b border-line', className)}
      {...props}
    />
  )
}

export function DialogTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn('text-lg font-extrabold text-ink', className)} {...props} />
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
      <Button
        variant="ghost"
        size="icon"
        aria-label="關閉"
        className={cn('text-ink-3 hover:text-ink active:opacity-70', className)}
        {...props}
      >
        <X size={18} />
      </Button>
    </DialogPrimitive.Close>
  )
}
