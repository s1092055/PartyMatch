import { cva } from "class-variance-authority"
import { cn } from "../../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold rounded-inner cursor-pointer transition-all duration-150 hover:-translate-y-0.5 focus:outline-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:   "bg-brand text-white hover:bg-brand-hover",
        secondary: "border border-brand-border bg-surface text-brand hover:bg-brand-subtle",
        ghost:     "text-ink-2 hover:bg-raised",
        danger:    "bg-danger text-white hover:bg-danger-text",
        success:   "bg-success text-white hover:bg-success-text",
        ink:       "bg-ink text-white hover:bg-ink-2",
      },
      size: {
        sm: "text-xs px-4 h-8",
        md: "text-sm px-5 h-11",
        lg: "text-base px-6 h-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export default function Button({ variant, size, loading = false, className, children, ...props }) {
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
