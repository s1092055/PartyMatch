import { Lock } from 'lucide-react'
import { LOCKED_MESSAGE, PRESENCE_COLORS } from './navConstants'

export function CountBadge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[0.6rem] font-black leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function LockBadge({ className = '' }) {
  return <Lock size={11} strokeWidth={2.3} className={`absolute rounded-full ${className}`} />
}

// 掛在頭像右下角的狀態點：使用者在「其他設定」手動選擇的線上狀態，不是自動偵測
export function PresenceDot({ status = 'online', className = '' }) {
  return <span className={`rounded-full border-2 border-white ${PRESENCE_COLORS[status] ?? PRESENCE_COLORS.online} ${className}`} />
}

export function LockedHint({ className = '' }) {
  return (
    <span
      className={`pointer-events-none absolute z-30 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-popover transition-opacity duration-150 group-hover/locked:opacity-100 group-focus-visible/locked:opacity-100 ${className}`}
    >
      {LOCKED_MESSAGE}
    </span>
  )
}
