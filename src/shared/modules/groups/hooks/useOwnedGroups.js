import { useMemo } from "react";
import { useGroupsStore } from "../state/groupsHooks.js";

export function useOwnedGroups(ownerId = null) {
  const { state } = useGroupsStore();

  const ownedGroups = useMemo(
    () => (ownerId ? state.groups.filter((group) => group.ownerId === ownerId) : []),
    [state.groups, ownerId],
  );

  return { ownedGroups };
}
