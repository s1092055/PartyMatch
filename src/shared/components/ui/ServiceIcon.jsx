import { getServiceIconPath } from "../../../data/services.config.js";

export function ServiceIcon({
  src,
  serviceId,
  platform,
  iconKey,
  alt,
  className = "",
  fallbackSrc = "/icons/google.png",
  ...props
}) {
  const resolvedSrc = src || getServiceIconPath(serviceId, platform, iconKey);

  return (
    <img
      src={resolvedSrc || fallbackSrc}
      alt={alt}
      loading="lazy"
      className={className}
      onError={(event) => {
        if (event.currentTarget.src.endsWith(fallbackSrc)) return;
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallbackSrc;
      }}
      {...props}
    />
  );
}
