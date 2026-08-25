import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

export const badgeVariantClasses = {
  default:     'bg-brand-subtle text-brand',
  secondary:   'bg-raised text-ink-2',
  destructive: 'bg-danger-subtle text-danger-text',
  outline:     'border border-line text-ink-2',
  success:     'bg-success-subtle text-success-text',
  warning:     'bg-warning-subtle text-warning-text',
  info:        'bg-info-subtle text-info-text',
  neutral:     'bg-raised text-ink-2',
};

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
