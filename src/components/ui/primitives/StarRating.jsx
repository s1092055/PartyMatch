import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value, onChange, readOnly = false, size = 11 }) {
  const [hoverValue, setHoverValue] = useState(0)

  if (readOnly) {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} className={i < value ? 'fill-warning text-warning' : 'text-line'} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= (hoverValue || value)
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(0)}
            aria-label={`${starValue} 星`}
            className="p-1"
          >
            <Star size={size} className={filled ? 'fill-warning text-warning' : 'text-line'} />
          </button>
        )
      })}
    </div>
  )
}
