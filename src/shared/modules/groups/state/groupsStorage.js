export const GROUPS_INITIAL_STATE = {
  groups: [],
  myGroups: {
    joined: [],
    hosted: [],
    followed: [],
    pending: [],
  },
  applications: [],
};

// groupApi localStorage is the source of truth; keep provider state ephemeral
// so one user's cached dashboard state never flashes into another user's session.
export function hydrateGroupsState() {
  return {
    groups: [...GROUPS_INITIAL_STATE.groups],
    myGroups: { joined: [], hosted: [], followed: [], pending: [] },
    applications: [],
  };
}
