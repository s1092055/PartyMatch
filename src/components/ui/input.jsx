import { cn } from "../../lib/utils"

const FIELD_BASE = 'w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-4 disabled:cursor-not-allowed disabled:bg-raised disabled:text-ink-3'

export function Input({ className, ...props }) {
  return <input className={cn(FIELD_BASE, className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(FIELD_BASE, className)} {...props} />
}
