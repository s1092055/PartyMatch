import { createContext, useEffect, useMemo, useReducer } from "react";
import { getGroupsState } from "../api/groupApi.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { groupsReducer } from "./groupsReducer.js";
import { GROUPS_ACTIONS } from "./groupsTypes.js";
import { GROUPS_INITIAL_STATE, hydrateGroupsState } from "./groupsStorage.js";

const GroupsStoreContext = createContext(null);

export function GroupsProvider({ children }) {
  const [state, dispatch] = useReducer(groupsReducer, undefined, hydrateGroupsState);
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    let isMounted = true;

    async function syncGroups() {
      try {
        const nextState = await getGroupsState(currentUserId);
        if (!isMounted) return;
        dispatch({ type: GROUPS_ACTIONS.LOAD_FROM_STORAGE, payload: nextState });
      } catch {
        if (!isMounted) return;
        dispatch({ type: GROUPS_ACTIONS.LOAD_FROM_STORAGE, payload: GROUPS_INITIAL_STATE });
      }
    }

    syncGroups();
    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <GroupsStoreContext.Provider value={value}>
      {children}
    </GroupsStoreContext.Provider>
  );
}

export { GroupsStoreContext };
