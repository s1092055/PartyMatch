import { Collapsible as CollapsiblePrimitive } from 'radix-ui'

export function Collapsible(props) {
  return <CollapsiblePrimitive.Root {...props} />
}

export function CollapsibleTrigger(props) {
  return <CollapsiblePrimitive.Trigger {...props} />
}

// data-[state]/CSS 動畫吃 Radix 提供的 --radix-collapsible-content-height 變數，
// 展開/收合都用真實內容高度做過渡，不是寫死的固定高度
export function CollapsibleContent({ className, ...props }) {
  return (
    <CollapsiblePrimitive.Content
      className={`overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up ${className ?? ''}`}
      {...props}
    />
  )
}
