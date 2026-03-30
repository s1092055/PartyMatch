import {
  ArrowDownTrayIcon,
  CloudArrowDownIcon,
  DevicePhoneMobileIcon,
  FilmIcon,
  MusicalNoteIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TvIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { getServiceCategoryById } from "../../data/services.config.js";

export function getHeroTheme(serviceId) {
  switch (serviceId) {
    case "netflix":
      return "from-[#0f172a] via-[#1e293b] to-[#dc2626]";
    case "spotify":
      return "from-[#052e16] via-[#14532d] to-[#22c55e]";
    case "nintendo":
      return "from-[#7f1d1d] via-[#b91c1c] to-[#f97316]";
    case "youtube":
      return "from-[#7f1d1d] via-[#dc2626] to-[#fca5a5]";
    case "google":
      return "from-[#0f172a] via-[#1d4ed8] to-[#60a5fa]";
    case "notion":
      return "from-[#111827] via-[#374151] to-[#9ca3af]";
    case "canva":
      return "from-[#0f172a] via-[#0ea5e9] to-[#a855f7]";
    default:
      return "from-[#0f172a] via-[#1d4ed8] to-[#60a5fa]";
  }
}

export function getCategoryLabel(service) {
  return getServiceCategoryById(service?.category)?.label ?? "訂閱共享";
}

export function getFeatureIcon(feature) {
  const normalized = String(feature).toLowerCase();

  if (
    normalized.includes("4k") ||
    normalized.includes("hdr") ||
    normalized.includes("1080") ||
    normalized.includes("ultra hd")
  ) {
    return TvIcon;
  }

  if (
    normalized.includes("下載") ||
    normalized.includes("download") ||
    normalized.includes("離線")
  ) {
    return ArrowDownTrayIcon;
  }

  if (
    normalized.includes("裝置") ||
    normalized.includes("device") ||
    normalized.includes("手機") ||
    normalized.includes("行動")
  ) {
    return DevicePhoneMobileIcon;
  }

  if (
    normalized.includes("影片") ||
    normalized.includes("movie") ||
    normalized.includes("netflix") ||
    normalized.includes("disney") ||
    normalized.includes("觀看") ||
    normalized.includes("video") ||
    normalized.includes("畫質")
  ) {
    return FilmIcon;
  }

  if (
    normalized.includes("音樂") ||
    normalized.includes("premium") ||
    normalized.includes("無廣告") ||
    normalized.includes("listen") ||
    normalized.includes("spotify")
  ) {
    return MusicalNoteIcon;
  }

  if (
    normalized.includes("家庭") ||
    normalized.includes("成員") ||
    normalized.includes("帳戶") ||
    normalized.includes("使用者") ||
    normalized.includes("profile") ||
    normalized.includes("多人")
  ) {
    return UserGroupIcon;
  }

  if (
    normalized.includes("備份") ||
    normalized.includes("雲端") ||
    normalized.includes("cloud")
  ) {
    return CloudArrowDownIcon;
  }

  if (
    normalized.includes("遊玩") ||
    normalized.includes("game") ||
    normalized.includes("switch")
  ) {
    return PlayIcon;
  }

  if (
    normalized.includes("監護") ||
    normalized.includes("安全") ||
    normalized.includes("驗證") ||
    normalized.includes("保護") ||
    normalized.includes("secure")
  ) {
    return ShieldCheckIcon;
  }

  return SparklesIcon;
}
