import { GROUPS_MOCK } from "../../../../data/groups.mock.js";
import { GROUPS_STORAGE_KEY, GROUPS_STORE_SCHEMA_VERSION } from "./groupsTypes.js";

export const GROUPS_INITIAL_STATE = {
  groups: GROUPS_MOCK,
  myGroups: {
    joined: [],
    hosted: [],
    followed: [],
  },
};

function isValidStoredGroup(group) {
  return (
    group &&
    typeof group.id === "string" &&
    typeof group.serviceId === "string" &&
    typeof group.planId === "string"
  );
}

function isValidStoredMyGroups(myGroups) {
  return (
    myGroups &&
    Array.isArray(myGroups.joined) &&
    Array.isArray(myGroups.hosted) &&
    Array.isArray(myGroups.followed) &&
    myGroups.joined.every((id) => typeof id === "string") &&
    myGroups.hosted.every((id) => typeof id === "string") &&
    myGroups.followed.every((id) => typeof id === "string")
  );
}

function resetStoredState() {
  localStorage.removeItem(GROUPS_STORAGE_KEY);
  return GROUPS_INITIAL_STATE;
}

export function hydrateGroupsState() {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) return GROUPS_INITIAL_STATE;

    const parsed = JSON.parse(raw);

    if (parsed?.version !== GROUPS_STORE_SCHEMA_VERSION) {
      return resetStoredState();
    }

    if (!Array.isArray(parsed.groups)) {
      return resetStoredState();
    }

    if (parsed.groups.length === 0 && GROUPS_INITIAL_STATE.groups.length > 0) {
      return resetStoredState();
    }

    if (!parsed.groups.every(isValidStoredGroup)) {
      return resetStoredState();
    }

    if (!isValidStoredMyGroups(parsed.myGroups)) {
      return resetStoredState();
    }

    return {
      groups: parsed.groups,
      myGroups: parsed.myGroups,
    };
  } catch {
    return resetStoredState();
  }
}

export function persistGroupsState(state) {
  localStorage.setItem(
    GROUPS_STORAGE_KEY,
    JSON.stringify({
      version: GROUPS_STORE_SCHEMA_VERSION,
      ...state,
    }),
  );
}
