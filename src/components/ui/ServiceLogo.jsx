import { useMemo, useState } from 'react'
import { getServiceTypeIcon } from '../../common/utils/serviceUtils'

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
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[22%] border border-line bg-white font-bold shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.36)] ${className}`}
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
