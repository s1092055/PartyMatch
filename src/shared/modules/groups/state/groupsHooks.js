import { useContext, useMemo } from "react";
import { GroupsStoreContext } from "./GroupsContext.jsx";
import { GROUPS_ACTIONS } from "./groupsTypes.js";

export function useGroupsStore() {
  const context = useContext(GroupsStoreContext);
  if (!context) {
    throw new Error("useGroupsStore 必須在 GroupsProvider 內使用");
  }
  return context;
}

export function useGroupsActions() {
  const { dispatch } = useGroupsStore();

  return useMemo(
    () => ({
      createGroup: (payload) =>
        dispatch({ type: GROUPS_ACTIONS.CREATE_GROUP, payload }),
      setGroups: (groups, hosted = []) =>
        dispatch({ type: GROUPS_ACTIONS.SET_GROUPS, payload: { groups, hosted } }),
      joinGroup: (groupId) =>
        dispatch({ type: GROUPS_ACTIONS.JOIN_GROUP, payload: { groupId } }),
      leaveGroup: (groupId) =>
        dispatch({ type: GROUPS_ACTIONS.LEAVE_GROUP, payload: { groupId } }),
      toggleFollowGroup: (groupId) =>
        dispatch({
          type: GROUPS_ACTIONS.TOGGLE_FOLLOW_GROUP,
          payload: { groupId },
        }),
      updateGroup: (groupId, patch) =>
        dispatch({
          type: GROUPS_ACTIONS.UPDATE_GROUP,
          payload: { groupId, patch },
        }),
      loadFromStorage: (payload) =>
        dispatch({ type: GROUPS_ACTIONS.LOAD_FROM_STORAGE, payload }),
    }),
    [dispatch],
  );
}
