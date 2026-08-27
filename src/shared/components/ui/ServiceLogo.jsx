import { useMemo, useState } from 'react'
import { getServiceTypeIcon } from '../../services/serviceTypes'

export default function ServiceLogo({ serviceId, size = 52, className = '' }) {
  const requestSize = Math.max(96, Math.ceil(size * 2.5))
  const icon = useMemo(
    () => getServiceTypeIcon(serviceId, { size: requestSize }),
    [requestSize, serviceId]
  )
  const [failedSrc, setFailedSrc] = useState('')
  const failed = failedSrc === icon.src

  return (
    <div
      className={`icon-box overflow-hidden border border-line bg-white ${className}`}
      style={{ width: size, height: size, backgroundColor: failed ? `${icon.color}18` : icon.surface }}
      aria-label={icon.alt}
    >
      {icon.src && !failed ? (
        <img
          src={icon.src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
          referrerPolicy="no-referrer"
          className="h-[76%] w-[76%] object-contain"
          style={{ imageRendering: 'auto' }}
          onError={() => setFailedSrc(icon.src)}
        />
      ) : (
        <span className="text-[0.8em] font-black leading-none" style={{ color: icon.color }}>
          {icon.fallbackText}
        </span>
      )}
    </div>
  )
}
