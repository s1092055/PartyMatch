import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const avatarVariants = cva(
  "rounded-full flex items-center justify-center text-white font-semibold shrink-0",
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-20 h-20 text-3xl',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

export function Avatar({ initial, color, size, className }) {
  return (
    <div className={cn(avatarVariants({ size }), className)} style={{ background: color }}>
      {initial}
    </div>
  )
}
