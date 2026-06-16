const BASE = 'inline-flex items-center justify-center gap-2 font-bold rounded-inner transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:scale-95'

const VARIANTS = {
  primary:   'bg-brand text-white hover:bg-brand-hover focus:ring-brand shadow-button hover:shadow-card-hover',
  secondary: 'border border-brand-border bg-surface text-brand hover:bg-brand-subtle focus:ring-brand',
  ghost:     'text-ink-2 hover:bg-raised focus:ring-line',
  danger:    'bg-danger text-white hover:bg-danger-text focus:ring-danger',
  success:   'bg-success text-white hover:bg-success-text focus:ring-success shadow-[0_10px_18px_-12px_rgb(16_178_108_/_0.75)]',
  ink:       'bg-ink text-white hover:bg-ink-2 focus:ring-ink',
}

const SIZES = {
  sm: 'text-xs px-4 h-8',
  md: 'text-sm px-5 h-11',
  lg: 'text-base px-6 h-12',
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
