import { useCallback, useContext, useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { GroupsStoreContext } from "./GroupsContext.jsx";
import { GROUPS_ACTIONS } from "./groupsTypes.js";
import {
  applyToGroup,
  approveApplication as approveApplicationApi,
  cancelApplication as cancelApplicationApi,
  createGroup as createGroupApi,
  deleteGroup as deleteGroupApi,
  getGroupsState,
  joinGroup as joinGroupApi,
  leaveGroup as leaveGroupApi,
  rejectApplication as rejectApplicationApi,
  toggleFollowGroup as toggleFollowGroupApi,
  updateGroup as updateGroupApi,
} from "../api/groupApi.js";

export function useGroupsStore() {
  const context = useContext(GroupsStoreContext);
  if (!context) {
    throw new Error("useGroupsStore 必須在 GroupsProvider 內使用");
  }
  return context;
}

export function useGroupsActions() {
  const { dispatch } = useGroupsStore();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const syncGroups = useCallback(
    async (targetUserId = currentUserId) => {
      const nextState = await getGroupsState(targetUserId);
      dispatch({ type: GROUPS_ACTIONS.LOAD_FROM_STORAGE, payload: nextState });
      return nextState;
    },
    [currentUserId, dispatch],
  );

  return useMemo(
    () => ({
      refreshGroups: syncGroups,
      createGroup: async (payload) => {
        if (!currentUserId) {
          throw new Error("請先登入後再建立群組。");
        }

        const nextGroup = await createGroupApi(payload, user);
        await syncGroups();
        return nextGroup;
      },
      updateGroup: async (groupId, patch) => {
        const updatedGroup = await updateGroupApi(groupId, patch);
        await syncGroups();
        return updatedGroup;
      },
      deleteGroup: async (groupId) => {
        const deletedGroup = await deleteGroupApi(groupId);
        await syncGroups();
        return deletedGroup;
      },
      dissolveGroup: async (groupId) => {
        const deletedGroup = await deleteGroupApi(groupId);
        await syncGroups();
        return deletedGroup;
      },
      joinGroup: async (groupId, userId = currentUserId) => {
        const joinedGroup = await joinGroupApi(groupId, userId);
        await syncGroups(userId);
        return joinedGroup;
      },
      leaveGroup: async (groupId, userId = currentUserId) => {
        const leftGroup = await leaveGroupApi(groupId, userId);
        await syncGroups(userId);
        return leftGroup;
      },
      applyGroup: async (groupId, userId, displayName, formData = {}) => {
        const actorUserId = userId ?? currentUserId;
        const application = await applyToGroup(groupId, {
          userId: actorUserId,
          displayName: displayName ?? user?.displayName ?? user?.email,
          ...formData,
        });
        await syncGroups(actorUserId);
        return application;
      },
      cancelApplication: async (groupId, userId = currentUserId) => {
        const result = await cancelApplicationApi(groupId, userId);
        await syncGroups(userId);
        return result;
      },
      approveApplication: async (applicationId) => {
        const result = await approveApplicationApi(applicationId);
        await syncGroups();
        return result;
      },
      rejectApplication: async (applicationId) => {
        const result = await rejectApplicationApi(applicationId);
        await syncGroups();
        return result;
      },
      toggleFollowGroup: async (groupId, userId = currentUserId) => {
        const result = await toggleFollowGroupApi(groupId, userId);
        await syncGroups(userId);
        return result;
      },
      setGroups: (groups, hosted = []) =>
        dispatch({ type: GROUPS_ACTIONS.SET_GROUPS, payload: { groups, hosted } }),
      loadFromStorage: (payload) =>
        dispatch({ type: GROUPS_ACTIONS.LOAD_FROM_STORAGE, payload }),
    }),
    [currentUserId, dispatch, syncGroups, user],
  );
}
