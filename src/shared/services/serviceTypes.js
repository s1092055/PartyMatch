import { SERVICES } from '../data/services.mock'

const ICONIFY_API_BASE = 'https://api.iconify.design'
const SERVICE_MAP = new Map(SERVICES.map(service => [service.id, service]))

export function listServiceTypes() {
  return SERVICES
}

export function getServiceTypeById(serviceId) {
  return SERVICE_MAP.get(serviceId) ?? null
}

export function getServiceById(serviceId) {
  return getServiceTypeById(serviceId)
}

export function getServiceTypeIcon(serviceId, { size = 64 } = {}) {
  const service = getServiceTypeById(serviceId)

  if (!service) {
    return {
      src: '',
      alt: '未知服務 icon',
      surface: '#F3F7FE',
      color: '#71819B',
      fallbackText: '?',
    }
  }

  const iconId = service.iconId
  const color = encodeURIComponent(service.color)
  const iconSize = Math.max(24, Math.ceil(size))
  const src = service.iconSrc
    ? service.iconSrc
    : iconId
      ? `${ICONIFY_API_BASE}/${iconId}.svg?width=${iconSize}&height=${iconSize}&color=${color}`
      : ''

  return {
    src,
    alt: `${service.name} icon`,
    surface: '#FFFFFF',
    color: service.color,
    fallbackText: service.initial,
  }
}
