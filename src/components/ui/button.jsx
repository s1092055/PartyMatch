import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

// 圖示工具鈕（Modal 關閉、翻頁箭頭等）維持 CLAUDE.md 訂的慣例：只有背景色
// 變化、不加 hover 位移，避免密集排列的小圖示鈕一起跳動；hover:-translate-y-0.5
// 因此不放進共用的 base class，只掛在有文字內容的 sm/md/lg 三個尺寸上，icon
// 尺寸不掛
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold rounded-inner cursor-pointer transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:     "bg-brand text-white hover:bg-brand-hover",
        secondary:   "border border-brand-border bg-surface text-brand hover:bg-brand-subtle",
        ghost:       "text-ink-2 hover:bg-raised",
        destructive: "bg-danger text-white hover:bg-danger-text",
        success:     "bg-success text-white hover:bg-success-text",
        ink:         "bg-ink text-white hover:bg-ink-2",
      },
      size: {
        sm:   "text-xs px-4 h-8 hover:-translate-y-0.5",
        md:   "text-sm px-5 h-11 hover:-translate-y-0.5",
        lg:   "text-base px-6 h-12 hover:-translate-y-0.5",
        icon: "h-8 w-8 shrink-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export function Button({ variant, size, loading = false, className, children, ...props }) {
  return (
    <button
      disabled={loading || props.disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading
        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        : children}
    </button>
  )
}

export { buttonVariants }
