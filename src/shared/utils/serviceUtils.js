import { useServiceStore } from '../stores/useServiceStore'
import kkboxIcon from '../../assets/KKBOX-icon.png'

const getServices = () => useServiceStore.getState().services
const _getById = (id) => useServiceStore.getState().getById(id)
import masterclassIcon from '../../assets/masterclass-icon.png'

const ICONIFY_API_BASE = 'https://api.iconify.design'

// 需要本地 PNG 資源的服務（無法從 Iconify 取得）
const LOCAL_ICON_ASSETS = {
  'kkbox':       kkboxIcon,
  'masterclass': masterclassIcon,
}

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
      surface: '#F3F7FE',
      color: '#71819B',
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
