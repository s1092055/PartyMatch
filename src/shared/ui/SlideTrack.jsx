import { Children, cloneElement, isValidElement } from 'react'

export default function SlideTrack({ activeIndex, count, children }) {
  return (
    <div className="h-full overflow-hidden">
      <div
        className="flex h-full items-stretch transition-transform duration-300 ease-in-out"
        style={{
          width: `${count * 100}%`,
          transform: `translateX(-${activeIndex * (100 / count)}%)`,
        }}
      >
        {Children.map(children, (child, i) =>
          isValidElement(child) ? cloneElement(child, { inactive: i !== activeIndex }) : child
        )}
      </div>
    </div>
  )
}

export function SlidePanel({ count, className = '', inactive = false, children }) {
  return (
    <div
      className={`h-full min-w-0 shrink-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      style={{ width: `${100 / count}%` }}
      aria-hidden={inactive || undefined}
      inert={inactive || undefined}
    >
      {children}
    </div>
  )
}
