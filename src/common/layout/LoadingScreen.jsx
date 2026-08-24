import { useLayoutEffect, useRef, useState } from 'react'
import logoUrl from '../../assets/Logo.svg'

export default function LoadingScreen() {
  const measureRef = useRef(null)
  const [typewriterWidth, setTypewriterWidth] = useState(null)

  useLayoutEffect(() => {
    if (measureRef.current) setTypewriterWidth(measureRef.current.offsetWidth)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <img src={logoUrl} alt="" className="h-14 w-14 animate-logo-bounce" />
      <span className="relative inline-block text-xl font-extrabold">

        <span ref={measureRef} className="invisible absolute left-0 top-0 whitespace-nowrap" aria-hidden="true">
          <span>Party</span><span>Match</span>
        </span>
        {typewriterWidth != null && (
          <span
            className="animate-typewriter block"
            style={{ '--typewriter-width': `${typewriterWidth}px` }}
          >
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        )}
      </span>
    </div>
  );
}
