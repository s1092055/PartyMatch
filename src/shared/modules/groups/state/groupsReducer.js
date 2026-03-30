import { GROUPS_ACTIONS, calculateGroupStatus } from "./groupsTypes.js";

export function groupsReducer(state, action) {
  switch (action.type) {
    case GROUPS_ACTIONS.LOAD_FROM_STORAGE: {
      return action.payload ?? state;
    }

    case GROUPS_ACTIONS.SET_GROUPS: {
      const { groups, hosted = [] } = action.payload;
      return {
        ...state,
        groups,
        myGroups: {
          ...state.myGroups,
          hosted: hosted.length ? hosted : state.myGroups.hosted,
          joined: state.myGroups.joined.filter((id) =>
            groups.some((group) => group.id === id),
          ),
          followed: state.myGroups.followed.filter((id) =>
            groups.some((group) => group.id === id),
          ),
        },
      };
    }

    case GROUPS_ACTIONS.CREATE_GROUP: {
      const newGroup = action.payload;
      const status = calculateGroupStatus(newGroup.totalSlots, newGroup.takenSlots);
      return {
        ...state,
        groups: [{ ...newGroup, status }, ...state.groups],
        myGroups: {
          ...state.myGroups,
          hosted: [...new Set([...state.myGroups.hosted, newGroup.id])],
        },
      };
    }

    case GROUPS_ACTIONS.JOIN_GROUP: {
      const { groupId } = action.payload;
      const target = state.groups.find((group) => group.id === groupId);
      if (
        !target ||
        target.takenSlots >= target.totalSlots ||
        state.myGroups.hosted.includes(groupId) ||
        state.myGroups.joined.includes(groupId)
      ) {
        return state;
      }

      const nextGroups = state.groups.map((group) => {
        if (group.id !== groupId) return group;
        const takenSlots = Math.min(group.totalSlots, group.takenSlots + 1);
        const availableSeats = Math.max(0, group.totalSlots - takenSlots);
        return {
          ...group,
          takenSlots,
          availableSeats,
          isApplied: true,
          status: calculateGroupStatus(group.totalSlots, takenSlots),
        };
      });

      const shouldTrackJoined = !state.myGroups.hosted.includes(groupId);
      return {
        ...state,
        groups: nextGroups,
        myGroups: {
          ...state.myGroups,
          joined: shouldTrackJoined
            ? [...new Set([...state.myGroups.joined, groupId])]
            : state.myGroups.joined,
        },
      };
    }

    case GROUPS_ACTIONS.LEAVE_GROUP: {
      const { groupId } = action.payload;
      if (!state.myGroups.joined.includes(groupId)) return state;

      const nextGroups = state.groups.map((group) => {
        if (group.id !== groupId) return group;
        const takenSlots = Math.max(0, group.takenSlots - 1);
        const availableSeats = Math.max(0, group.totalSlots - takenSlots);
        return {
          ...group,
          takenSlots,
          availableSeats,
          isApplied: false,
          status: calculateGroupStatus(group.totalSlots, takenSlots),
        };
      });

      return {
        ...state,
        groups: nextGroups,
        myGroups: {
          ...state.myGroups,
          joined: state.myGroups.joined.filter((id) => id !== groupId),
        },
      };
    }

    case GROUPS_ACTIONS.TOGGLE_FOLLOW_GROUP: {
      const { groupId } = action.payload;
      const isFollowed = state.myGroups.followed.includes(groupId);

      return {
        ...state,
        myGroups: {
          ...state.myGroups,
          followed: isFollowed
            ? state.myGroups.followed.filter((id) => id !== groupId)
            : [...new Set([...state.myGroups.followed, groupId])],
        },
      };
    }

    case GROUPS_ACTIONS.UPDATE_GROUP: {
      const { groupId, patch } = action.payload;
      return {
        ...state,
        groups: state.groups.map((group) =>
          group.id === groupId ? { ...group, ...patch } : group,
        ),
      };
    }

    default:
      return state;
  }
}
