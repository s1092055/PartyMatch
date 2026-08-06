import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "../../lib/utils"

export function Tabs({ className, ...props }) {
  return <TabsPrimitive.Root className={cn("flex flex-col gap-2", className)} {...props} />
}

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-2xl bg-raised p-1",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, children, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold text-ink-3 transition-colors",
        "hover:text-ink",
        "data-[state=active]:bg-surface data-[state=active]:text-brand data-[state=active]:shadow-sm",
        "outline-none focus-visible:ring-4 focus-visible:ring-brand-subtle",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn("animate-modal-in outline-none", className)}
      {...props}
    />
  )
}
