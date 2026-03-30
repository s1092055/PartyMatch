import { createContext, useEffect, useMemo, useReducer } from "react";
import { groupsReducer } from "./groupsReducer.js";
import { GROUPS_ACTIONS } from "./groupsTypes.js";
import { loadGroupsBootstrap } from "./groupsBootstrap.js";
import { hydrateGroupsState, persistGroupsState } from "./groupsStorage.js";
import { useAuth } from "../../auth/hooks/useAuth.js";

const GroupsStoreContext = createContext(null);

export function GroupsProvider({ children }) {
  const [state, dispatch] = useReducer(groupsReducer, undefined, hydrateGroupsState);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function syncGroups() {
      try {
        const nextGroups = await loadGroupsBootstrap(user?.uid);
        if (!isMounted) return;

        dispatch({
          type: GROUPS_ACTIONS.SET_GROUPS,
          payload: nextGroups,
        });
      } catch {
        if (!isMounted) return;
        dispatch({
          type: GROUPS_ACTIONS.SET_GROUPS,
          payload: {
            groups: [],
            hosted: [],
          },
        });
      }
    }

    syncGroups();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    persistGroupsState(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <GroupsStoreContext.Provider value={value}>
      {children}
    </GroupsStoreContext.Provider>
  );
}

export { GroupsStoreContext };
