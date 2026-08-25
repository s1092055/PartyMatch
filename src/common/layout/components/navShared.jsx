import { Lock } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { LOCKED_MESSAGE, PRESENCE_COLORS } from './navConstants'

export function CountBadge({ count, className }) {
  if (!count) return null
  return (
    <span className={cn('absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-0.5 text-2xs font-black leading-none text-white', className)}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function LockBadge({ className }) {
  return <Lock size={11} strokeWidth={1.5} className={cn('absolute -right-1 -top-1 rounded-full', className)} />
}

export function PresenceDot({ status = 'online', className = '', style }) {
  return <span className={`rounded-full border-2 border-white ${PRESENCE_COLORS[status] ?? PRESENCE_COLORS.online} ${className}`} style={style} />
}

export function LockedHint({ className = '' }) {
  return (
    <span
      className={`pointer-events-none absolute z-30 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-bold text-canvas opacity-0 shadow-popover transition-opacity duration-150 group-hover/locked:opacity-100 group-focus-visible/locked:opacity-100 ${className}`}
    >
      {LOCKED_MESSAGE}
    </span>
  )
}
