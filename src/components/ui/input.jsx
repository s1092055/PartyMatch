import { cn } from "../../lib/utils"

const WRAPPER_BASE = 'flex items-center rounded-control border border-line bg-surface px-3.5 py-2.5 transition-[box-shadow] focus-within:ring-4 focus-within:ring-brand-subtle has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-raised';
const FIELD_BASE = 'w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4 disabled:cursor-not-allowed disabled:text-ink-3'

export function Input({ className, endAdornment, ...props }) {
  return (
    <span className={cn(WRAPPER_BASE, className)}>
      <input className={FIELD_BASE} {...props} />
      {endAdornment}
    </span>
  )
}

export function Textarea({ className, ...props }) {
  return (
    <span className={cn(WRAPPER_BASE, 'items-stretch', className)}>
      <textarea className={cn(FIELD_BASE, 'resize-none')} {...props} />
    </span>
  );
}
