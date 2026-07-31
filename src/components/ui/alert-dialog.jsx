import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { cn } from "../../lib/utils"
import { Button } from "./button"

export function AlertDialog(props) {
  return <AlertDialogPrimitive.Root {...props} />
}

function AlertDialogPortal(props) {
  return <AlertDialogPrimitive.Portal {...props} />
}

function AlertDialogOverlay({ className, ...props }) {
  return <AlertDialogPrimitive.Overlay className={cn('fixed inset-0 z-[70] bg-black/70', className)} {...props} />
}

export function AlertDialogContent({ className, ...props }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
        <AlertDialogPrimitive.Content
          className={cn('w-full max-w-sm animate-fade-in-up rounded-2xl bg-surface p-6 shadow-2xl', className)}
          {...props}
        />
      </div>
    </AlertDialogPortal>
  )
}

export function AlertDialogHeader({ className, ...props }) {
  return <div className={cn('mb-2 flex items-center gap-2', className)} {...props} />
}

export function AlertDialogFooter({ className, ...props }) {
  return <div className={cn('mt-6 flex gap-3', className)} {...props} />
}

export function AlertDialogTitle({ className, ...props }) {
  return <AlertDialogPrimitive.Title className={cn('text-base font-extrabold text-ink', className)} {...props} />
}

export function AlertDialogDescription({ className, ...props }) {
  return <AlertDialogPrimitive.Description className={cn('text-sm leading-relaxed text-ink-3', className)} {...props} />
}

export function AlertDialogAction({ className, danger, ...props }) {
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button variant={danger ? 'destructive' : 'default'} className={cn('flex-1', className)} {...props} />
    </AlertDialogPrimitive.Action>
  )
}

export function AlertDialogCancel({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button variant="ghost" className={cn('flex-1 border border-line text-ink', className)} {...props} />
    </AlertDialogPrimitive.Cancel>
  )
}
