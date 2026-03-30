import { getGroups } from "../services/groupService.js";

export async function loadGroupsBootstrap(userId) {
  const groups = await getGroups();
  const hosted = userId
    ? groups.filter((group) => group.ownerId === userId).map((group) => group.id)
    : [];

  return { groups, hosted };
}
