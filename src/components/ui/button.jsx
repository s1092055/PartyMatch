import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold rounded-inner cursor-pointer transition-all duration-150 outline-none focus-visible:ring-4 focus-visible:ring-brand-subtle disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:     "bg-brand text-white hover:bg-brand-hover",
        secondary:   "border border-brand-border bg-surface text-brand hover:bg-brand-subtle",
        ghost:       "text-ink-2 hover:bg-raised",
        destructive: "bg-danger text-white hover:bg-danger-text",
        success:     "bg-success text-white hover:bg-success-text",
        ink: "bg-brand text-white hover:bg-brand-hover",
      },
      size: {
        sm:     "text-xs px-4 h-8 hover:-translate-y-0.5",
        md:     "text-sm px-5 h-11 hover:-translate-y-0.5",
        lg:     "text-base px-6 h-12 hover:-translate-y-0.5",
        icon:   "h-8 w-8 shrink-0 rounded-full",
        iconLg: "h-10 w-10 shrink-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

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
