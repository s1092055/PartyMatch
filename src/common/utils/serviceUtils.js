import { useServiceStore } from '../stores/useServiceStore'
import kkboxIcon from '../../assets/KKBOX-icon.png'
import masterclassIcon from '../../assets/masterclass-icon.png'
import fridayIcon from '../../assets/friDay-icon.png'
import spotifyIcon from '../../assets/service-icons/spotify.svg'
import youtubeIcon from '../../assets/service-icons/youtube.svg'
import netflixIcon from '../../assets/service-icons/netflix.svg'
import disneyIcon from '../../assets/service-icons/disney.svg'
import googleOneIcon from '../../assets/service-icons/google-one.svg'
import chatgptIcon from '../../assets/service-icons/chatgpt.svg'
import appleTvIcon from '../../assets/service-icons/apple-tv.svg'
import hboIcon from '../../assets/service-icons/hbo.svg'
import discordIcon from '../../assets/service-icons/discord.svg'
import crunchyrollIcon from '../../assets/service-icons/crunchyroll.svg'
import appleMusicIcon from '../../assets/service-icons/apple-music.svg'
import claudeIcon from '../../assets/service-icons/claude.svg'
import midjourneyIcon from '../../assets/service-icons/midjourney.svg'
import cursorIcon from '../../assets/service-icons/cursor.svg'
import microsoft365Icon from '../../assets/service-icons/microsoft-365.svg'
import adobeCcIcon from '../../assets/service-icons/adobe-cc.svg'
import canvaIcon from '../../assets/service-icons/canva.svg'
import notionIcon from '../../assets/service-icons/notion.svg'
import icloudIcon from '../../assets/service-icons/icloud.svg'
import dropboxIcon from '../../assets/service-icons/dropbox.svg'
import duolingoIcon from '../../assets/service-icons/duolingo.svg'
import nintendoOnlineIcon from '../../assets/service-icons/nintendo-online.svg'
import nordvpnIcon from '../../assets/service-icons/nordvpn.svg'
import expressvpnIcon from '../../assets/service-icons/expressvpn.svg'
import appleOneIcon from '../../assets/service-icons/apple-one.svg'

const getServices = () => useServiceStore.getState().services
const _getById = (id) => useServiceStore.getState().getById(id);

const LOCAL_ICON_ASSETS = {
  'kkbox':            kkboxIcon,
  'masterclass':      masterclassIcon,
  'friday-video':     fridayIcon,
  'spotify':          spotifyIcon,
  'youtube':          youtubeIcon,
  'netflix':          netflixIcon,
  'disney':           disneyIcon,
  'google-one':       googleOneIcon,
  'chatgpt':          chatgptIcon,
  'apple-tv':         appleTvIcon,
  'hbo':              hboIcon,
  'discord':          discordIcon,
  'crunchyroll':      crunchyrollIcon,
  'apple-music':      appleMusicIcon,
  'claude':           claudeIcon,
  'midjourney':       midjourneyIcon,
  'cursor':           cursorIcon,
  'microsoft-365':    microsoft365Icon,
  'adobe-cc':         adobeCcIcon,
  'canva':            canvaIcon,
  'notion':           notionIcon,
  'icloud':           icloudIcon,
  'dropbox':          dropboxIcon,
  'duolingo':         duolingoIcon,
  'nintendo-online':  nintendoOnlineIcon,
  'nordvpn':          nordvpnIcon,
  'expressvpn':       expressvpnIcon,
  'apple-one':        appleOneIcon,
};

export function listServiceTypes() {
  return getServices()
}

export function getServiceById(serviceId) {
  return _getById(serviceId)
}

export function getServiceTypeIcon(serviceId) {
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

  return {
    src: LOCAL_ICON_ASSETS[serviceId] ?? '',
    alt: `${service.name} icon`,
    surface: '#FFFFFF',
    color: service.color,
    fallbackText: service.initial,
  }
}
