import { cva } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import { BADGE_LABELS, BADGE_VARIANTS } from './badgeLabels'

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 rounded-badge text-2xs font-semibold whitespace-nowrap",
  {
    variants: { variant: BADGE_VARIANTS },
    defaultVariants: { variant: 'default' },
  }
)

export default function Badge({ variant = 'default', label, className }) {
  const resolvedVariant = BADGE_VARIANTS[variant] ? variant : 'default'
  const text = label ?? BADGE_LABELS[variant] ?? variant

  return (
    <span className={cn(badgeVariants({ variant: resolvedVariant }), className)}>
      {text}
    </span>
  )
}
