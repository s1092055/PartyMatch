import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

// default/secondary/destructive/outline 是 shadcn 官方詞彙；success/warning/info/neutral
// 是本專案延伸的語意色（比照 Button 的 success/ink 延伸做法），業務狀態顏色透過
// components/ui/StatusBadge.jsx 對照到這些 variant，不在這裡處理業務語意
export const badgeVariantClasses = {
  default:     'bg-brand-subtle text-brand',
  secondary:   'bg-raised text-ink-2',
  destructive: 'bg-danger-subtle text-danger-text',
  outline:     'border border-line text-ink-2',
  success:     'bg-success-subtle text-success-text',
  warning:     'bg-warning-subtle text-warning-text',
  info:        'bg-info-subtle text-info-text',
  neutral:     'bg-slate-100 text-slate-400',
}

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-2xs font-semibold whitespace-nowrap",
  {
    variants: { variant: badgeVariantClasses },
    defaultVariants: { variant: 'default' },
  }
)

export function Badge({ variant = 'default', className, children }) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
}
