import {
  createGroup as createGroupApi,
  getAllGroups,
  getGroupById as getGroupByIdApi,
  getGroups as getGroupsByOwnerApi,
  updateGroup as updateGroupApi,
} from "../api/groupApi.js";

export async function getGroups() {
  return getAllGroups();
}

export async function getGroupById(id) {
  return getGroupByIdApi(id);
}

export async function createGroup(groupData, user) {
  return createGroupApi(groupData, user);
}

export async function getGroupsByOwner(userId) {
  return getGroupsByOwnerApi(userId);
}

export async function updateStoredGroup(groupId, patch) {
  if (
    !groupId ||
    !patch ||
    typeof patch !== "object" ||
    Array.isArray(patch) ||
    Object.keys(patch).length === 0
  ) {
    return null;
  }

  return updateGroupApi(groupId, patch);
}
