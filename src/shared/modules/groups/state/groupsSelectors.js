function isOwnedByUser(group, userId) {
  return Boolean(userId) && group?.ownerId === userId;
}

export function isExploreVisibleGroup(group, userId) {
  if (!group) return false;
  if (isOwnedByUser(group, userId)) return false;
  if (group.isMock) return false;

  const totalSlots = group.totalSlots ?? 0;
  const takenSlots = group.takenSlots ?? 0;

  if (totalSlots > 0 && takenSlots >= totalSlots) return false;

  return !["full", "closed", "expired", "dissolved"].includes(group.status);
}

export function selectVisibleExploreGroups(state, userId) {
  return state.groups.filter((group) => isExploreVisibleGroup(group, userId));
}

export function selectFollowedGroups(state) {
  const followedSet = new Set(state.myGroups.followed ?? []);
  return state.groups.filter((group) => followedSet.has(group.id));
}

export function selectMyGroups(state) {
  const hostedSet = new Set(state.myGroups.hosted);
  const joinedSet = new Set(state.myGroups.joined);

  return state.groups
    .filter((group) => hostedSet.has(group.id) || joinedSet.has(group.id))
    .map((group) => ({
      ...group,
      role: hostedSet.has(group.id) ? "host" : "member",
    }));
}

export function selectPendingApplicationsByGroup(state, groupId) {
  return (state.applications ?? []).filter(
    (app) => app.groupId === groupId && app.status === "pending",
  );
}

export function selectApplicationsByHost(state, hostedGroupIds) {
  const hostedSet = new Set(hostedGroupIds);
  return (state.applications ?? []).filter(
    (app) => hostedSet.has(app.groupId) && app.status === "pending",
  );
}

export function selectMyPendingGroups(state) {
  const pendingSet = new Set(state.myGroups.pending ?? []);
  return state.groups.filter((group) => pendingSet.has(group.id));
}
