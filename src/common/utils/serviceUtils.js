import { useServiceStore } from '../stores/useServiceStore'
import kkboxIcon from '../../assets/KKBOX-icon.png'
import masterclassIcon from '../../assets/masterclass-icon.png'
import fridayIcon from '../../assets/friDay-icon.png'

const getServices = () => useServiceStore.getState().services
const _getById = (id) => useServiceStore.getState().getById(id)

const ICONIFY_API_BASE = 'https://api.iconify.design'

const LOCAL_ICON_ASSETS = {
  'kkbox':       kkboxIcon,
  'masterclass': masterclassIcon,
  'friday-video': fridayIcon,
};

export function listServiceTypes() {
  return getServices()
}

export function getServiceById(serviceId) {
  return _getById(serviceId)
}

export function getServiceTypeIcon(serviceId, { size = 64 } = {}) {
  const service = _getById(serviceId)

  if (!service) {
    return {
      src: '',
      alt: '未知服務 icon',
      surface: '#FFFFFF',
      color: '#64718A',
      fallbackText: '?',
    }
  }

  const localSrc = LOCAL_ICON_ASSETS[serviceId]
  const iconId = service.iconId
  const color = encodeURIComponent(service.color)
  const iconSize = Math.max(24, Math.ceil(size))
  const src = localSrc
    ? localSrc
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
