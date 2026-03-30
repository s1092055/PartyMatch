import {
  HeartIcon,
  RectangleGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export const DASHBOARD_MODES = {
  EXPLORER: "explorer",
  HOST: "host",
};

export const DASHBOARD_MODE_STORAGE_KEY = "pm-dashboard-mode";

const explorerPrimaryItems = [
  {
    to: "/manage-group",
    label: "我加入的群組",
    description: "集中查看你目前參與中的共享群組。",
    icon: UsersIcon,
  },
];

const hostPrimaryItems = [
  {
    to: "/manage-group/hosted-groups",
    label: "我建立的群組",
    description: "管理你建立的群組與目前招募狀態。",
    icon: RectangleGroupIcon,
  },
];

const commonItems = [
  {
    to: "/manage-group/favorites",
    label: "追蹤群組",
    description: "收藏並追蹤感興趣的群組。",
    icon: HeartIcon,
  },
];

const actionItems = [];

const explorerRoutePaths = new Set(
  explorerPrimaryItems
    .filter((item) => item.to.startsWith("/manage-group"))
    .map((item) => item.to)
    .concat("/manage-group/my-groups", "/manage-group/overview"),
);

const hostRoutePaths = new Set(
  hostPrimaryItems
    .filter((item) => item.to.startsWith("/manage-group"))
    .map((item) => item.to),
);

const commonRoutePaths = new Set(commonItems.map((item) => item.to));

export const DASHBOARD_DEFAULT_PATHS = {
  [DASHBOARD_MODES.EXPLORER]: "/manage-group",
  [DASHBOARD_MODES.HOST]: "/manage-group/hosted-groups",
};

export function getDashboardModeMenu(mode) {
  return {
    primary:
      mode === DASHBOARD_MODES.HOST ? hostPrimaryItems : explorerPrimaryItems,
    common: commonItems,
    actions: actionItems,
  };
}

export function getDashboardMobileSwitcherItems(mode) {
  return getDashboardModeMenu(mode).primary.map((item) => ({
    value: item.to,
    label: item.label,
  }));
}

export function getDashboardPathMode(pathname) {
  if (hostRoutePaths.has(pathname)) return DASHBOARD_MODES.HOST;
  if (explorerRoutePaths.has(pathname)) return DASHBOARD_MODES.EXPLORER;
  if (commonRoutePaths.has(pathname)) return "common";
  return null;
}

export function isPathAllowedForMode(pathname, mode) {
  const pathMode = getDashboardPathMode(pathname);
  return pathMode === "common" || pathMode === mode;
}
