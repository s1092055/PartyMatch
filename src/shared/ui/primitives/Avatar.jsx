const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-3xl',
}

export default function Avatar({ initial, color, size = 'md', className = '' }) {
  return (
    <div
      className={`${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
      style={{ background: color }}
    >
      {initial}
    </div>
  )
}
