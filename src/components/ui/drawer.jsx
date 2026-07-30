import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "../../lib/utils"

export function Drawer(props) {
  return <DrawerPrimitive.Root {...props} />
}

function DrawerPortal(props) {
  return <DrawerPrimitive.Portal {...props} />
}

export function DrawerClose(props) {
  return <DrawerPrimitive.Close {...props} />
}

function DrawerOverlay({ className, ...props }) {
  return (
    <DrawerPrimitive.Overlay
      className={cn('fixed inset-0 z-[56] bg-black/50', className)}
      {...props}
    />
  )
}

export function DrawerContent({ className, ...props }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn(
          'group/drawer-content fixed z-[56] flex h-auto flex-col bg-white shadow-2xl',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:max-h-[80dvh] data-[vaul-drawer-direction=bottom]:rounded-t-2xl data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=bottom]:border-line',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-80 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:border-line md:data-[vaul-drawer-direction=left]:w-96',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-80 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:border-line md:data-[vaul-drawer-direction=right]:w-96',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:max-h-[80dvh] data-[vaul-drawer-direction=top]:rounded-b-2xl data-[vaul-drawer-direction=top]:border-b data-[vaul-drawer-direction=top]:border-line',
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-3 hidden h-1.5 w-12 shrink-0 rounded-full bg-line group-data-[vaul-drawer-direction=bottom]/drawer-content:block group-data-[vaul-drawer-direction=top]/drawer-content:block" />
        {props.children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

export function DrawerHeader({ className, ...props }) {
  return <div className={cn('flex shrink-0 items-center justify-between border-b border-line px-4 h-14', className)} {...props} />
}

export function DrawerFooter({ className, ...props }) {
  return <div className={cn('mt-auto flex shrink-0 flex-col gap-2 border-t border-line p-4', className)} {...props} />
}

export function DrawerTitle({ className, ...props }) {
  return <DrawerPrimitive.Title className={cn('text-sm font-extrabold text-ink', className)} {...props} />
}

export function DrawerDescription({ className, ...props }) {
  return <DrawerPrimitive.Description className={cn('text-sm text-ink-3', className)} {...props} />
}
