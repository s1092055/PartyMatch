export const GROUPS_ACTIONS = {
  CREATE_GROUP: "GROUPS/CREATE_GROUP",
  SET_GROUPS: "GROUPS/SET_GROUPS",
  JOIN_GROUP: "GROUPS/JOIN_GROUP",
  LEAVE_GROUP: "GROUPS/LEAVE_GROUP",
  TOGGLE_FOLLOW_GROUP: "GROUPS/TOGGLE_FOLLOW_GROUP",
  UPDATE_GROUP: "GROUPS/UPDATE_GROUP",
  LOAD_FROM_STORAGE: "GROUPS/LOAD_FROM_STORAGE",
};

export const GROUP_STATUS = {
  OPEN: "open",
  ALMOST_FULL: "almost_full",
  FULL: "full",
  EXPIRED: "expired",
  CLOSED: "closed",
  RECRUITING: "recruiting",
};

export const SORT_KEYS = {
  NEWEST: "newest",
  REMAINING: "remaining",
  PRICE_ASC: "priceAsc",
};

/** 根據已佔位數與總位數計算群組狀態 */
export function calculateGroupStatus(totalSlots, takenSlots) {
  const remaining = Math.max(0, totalSlots - takenSlots);
  if (remaining <= 0) return GROUP_STATUS.FULL;
  if (remaining === 1) return GROUP_STATUS.ALMOST_FULL;
  return GROUP_STATUS.OPEN;
}

export const GROUPS_STORAGE_KEY = "pm-groups-store";
export const GROUPS_STORE_SCHEMA_VERSION = 4;
