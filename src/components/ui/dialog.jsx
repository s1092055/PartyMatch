import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from 'lucide-react'
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { useScrollLock } from "../../common/utils/hooks"

const VARIANT_CONTENT = {
  default: 'max-w-5xl rounded-2xl border border-line bg-canvas shadow-popover',
  panel:   'max-w-md rounded-card border border-line bg-surface shadow-card p-0',
};
const VARIANT_Z = { default: 'z-[56]', panel: 'z-[65]' }

// Radix Dialog 內建的 body 捲動鎖定（react-remove-scroll，靠 overflow:hidden）在 iOS Safari
// 鍵盤彈出時攔不住系統把整個 document 捲到很深的位置，Modal 關閉後就會露出這個殘留的捲動狀態；
// 這裡疊加專案自製、用 position:fixed 硬鎖 body 的 useScrollLock，讓 body 完全脫離捲動流才是真的擋得住
export function Dialog(props) {
  useScrollLock(props.open ?? false)
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

export function DialogContent({ className, variant = 'default', maxWidth, height, outerPadding = 'p-4 md:p-8', instant, onInteractOutside, ...props }) {
  function handleInteractOutside(event) {
    if (event.target.closest?.('[data-sonner-toaster], [data-image-lightbox]')) {
      event.preventDefault()
      return
    }
    onInteractOutside?.(event)
  }

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
          onInteractOutside={handleInteractOutside}
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
        <X strokeWidth={1.5} size={18} />
      </Button>
    </DialogPrimitive.Close>
  )
}
