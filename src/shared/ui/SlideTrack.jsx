import { Children, cloneElement, isValidElement } from 'react'

export default function SlideTrack({ activeIndex, count, children }) {
  return (
    <div className="overflow-hidden">
      <div
        className="flex items-start transition-transform duration-300 ease-in-out"
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
      className={`min-w-0 shrink-0 ${className}`}
      style={{ width: `${100 / count}%` }}
      aria-hidden={inactive || undefined}
      inert={inactive || undefined}
    >
      {children}
    </div>
  )
}
