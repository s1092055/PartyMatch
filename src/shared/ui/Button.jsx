const BASE = 'inline-flex items-center justify-center gap-2 font-bold rounded-inner cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed'

const VARIANTS = {
  primary:   'bg-brand text-white hover:bg-brand-hover focus:ring-brand shadow-button hover:shadow-card-hover',
  secondary: 'border border-brand-border bg-surface text-brand hover:bg-brand-subtle focus:ring-brand',
  ghost:     'text-ink-2 hover:bg-raised focus:ring-line',
  danger:    'bg-danger text-white hover:bg-danger-text focus:ring-danger',
  success:   'bg-success text-white hover:bg-success-text focus:ring-success shadow-success',
  ink:       'bg-ink text-white hover:bg-ink-2 focus:ring-ink',
}

const SIZES = {
  sm: 'text-xs px-4 h-8',
  md: 'text-sm px-5 h-11',
  lg: 'text-base px-6 h-12',
}

export default function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, ...props }) {
  return (
    <button disabled={loading || props.disabled} className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...props}>
      {loading
        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        : children}
    </button>
  )
}
