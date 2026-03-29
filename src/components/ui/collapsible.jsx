import { Collapsible as CollapsiblePrimitive } from 'radix-ui'

export function Collapsible(props) {
  return <CollapsiblePrimitive.Root {...props} />
}

export function CollapsibleTrigger(props) {
  return <CollapsiblePrimitive.Trigger {...props} />
}

export function CollapsibleContent({ className, ...props }) {
  return (
    <CollapsiblePrimitive.Content
      className={`overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up ${className ?? ''}`}
      {...props}
    />
  )
}
