import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"
import logoUrl from "../../assets/Logo.svg"

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

// initial 為空代表這位使用者關閉了「顯示自己的大頭照」（後端已把 avatarInitial/avatarColor
// 遮罩成 null），一律 fallback 成 PartyMatch logo，不畫彩色圓圈也不顯示姓名縮寫
export function Avatar({ initial, color, size, className }) {
  if (!initial) {
    return (
      <div className={cn(avatarVariants({ size }), 'border border-line bg-surface', className)}>
        <img src={logoUrl} alt="" className="h-1/2 w-1/2" />
      </div>
    )
  }
  return (
    <div className={cn(avatarVariants({ size }), className)} style={{ background: color }}>
      {initial}
    </div>
  )
}
