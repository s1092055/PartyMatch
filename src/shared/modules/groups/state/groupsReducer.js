import { GROUPS_ACTIONS, APPLICATION_STATUS, JOIN_POLICY, calculateGroupStatus } from "./groupsTypes.js";

const addUnique = (list, item) => [...new Set([...list, item])];

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
          hosted,
          joined: state.myGroups.joined.filter((id) =>
            groups.some((group) => group.id === id),
          ),
          followed: state.myGroups.followed.filter((id) =>
            groups.some((group) => group.id === id),
          ),
          pending: (state.myGroups.pending ?? []).filter((id) =>
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
          hosted: addUnique(state.myGroups.hosted, newGroup.id),
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
            ? addUnique(state.myGroups.joined, groupId)
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

    case GROUPS_ACTIONS.APPLY_GROUP: {
      const { groupId, userId, displayName, introduction, contact, paymentMethod } = action.payload;
      const target = state.groups.find((group) => group.id === groupId);
      if (
        !target ||
        target.joinPolicy !== JOIN_POLICY.REVIEW ||
        target.takenSlots >= target.totalSlots ||
        state.myGroups.hosted.includes(groupId) ||
        state.myGroups.joined.includes(groupId) ||
        (state.myGroups.pending ?? []).includes(groupId)
      ) {
        return state;
      }

      const application = {
        id: `app-${groupId}-${userId}-${Date.now()}`,
        groupId,
        userId,
        displayName: displayName || "匿名使用者",
        status: APPLICATION_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        introduction: introduction ?? "",
        contact: contact ?? "",
        paymentMethod: paymentMethod ?? "",
      };

      return {
        ...state,
        applications: [...(state.applications ?? []), application],
        myGroups: {
          ...state.myGroups,
          pending: addUnique(state.myGroups.pending ?? [], groupId),
        },
      };
    }

    case GROUPS_ACTIONS.CANCEL_APPLICATION: {
      const { groupId, userId } = action.payload;
      if (!(state.myGroups.pending ?? []).includes(groupId)) return state;

      return {
        ...state,
        applications: (state.applications ?? []).filter(
          (app) => !(app.groupId === groupId && app.userId === userId),
        ),
        myGroups: {
          ...state.myGroups,
          pending: (state.myGroups.pending ?? []).filter((id) => id !== groupId),
        },
      };
    }

    case GROUPS_ACTIONS.APPROVE_APPLICATION: {
      const { applicationId } = action.payload;
      const app = (state.applications ?? []).find((a) => a.id === applicationId);
      if (!app || app.status !== APPLICATION_STATUS.PENDING) return state;

      const target = state.groups.find((group) => group.id === app.groupId);
      if (!target || target.takenSlots >= target.totalSlots) return state;

      const nextGroups = state.groups.map((group) => {
        if (group.id !== app.groupId) return group;
        const takenSlots = Math.min(group.totalSlots, group.takenSlots + 1);
        const availableSeats = Math.max(0, group.totalSlots - takenSlots);
        return {
          ...group,
          takenSlots,
          availableSeats,
          status: calculateGroupStatus(group.totalSlots, takenSlots),
        };
      });

      return {
        ...state,
        groups: nextGroups,
        applications: (state.applications ?? []).map((a) =>
          a.id === applicationId
            ? { ...a, status: APPLICATION_STATUS.APPROVED }
            : a,
        ),
        myGroups: {
          ...state.myGroups,
          joined: addUnique(state.myGroups.joined, app.groupId),
          pending: (state.myGroups.pending ?? []).filter((id) => id !== app.groupId),
        },
      };
    }

    case GROUPS_ACTIONS.REJECT_APPLICATION: {
      const { applicationId } = action.payload;
      const app = (state.applications ?? []).find((a) => a.id === applicationId);
      if (!app || app.status !== APPLICATION_STATUS.PENDING) return state;

      return {
        ...state,
        applications: (state.applications ?? []).map((a) =>
          a.id === applicationId
            ? { ...a, status: APPLICATION_STATUS.REJECTED }
            : a,
        ),
        myGroups: {
          ...state.myGroups,
          pending: (state.myGroups.pending ?? []).filter((id) => id !== app.groupId),
        },
      };
    }

    case GROUPS_ACTIONS.REMOVE_MEMBER: {
      const { groupId, memberId } = action.payload;
      if (!state.myGroups.hosted.includes(groupId)) return state;

      const nextGroups = state.groups.map((group) => {
        if (group.id !== groupId) return group;
        const takenSlots = Math.max(0, group.takenSlots - 1);
        const availableSeats = Math.max(0, group.totalSlots - takenSlots);
        return {
          ...group,
          takenSlots,
          availableSeats,
          status: calculateGroupStatus(group.totalSlots, takenSlots),
        };
      });

      return {
        ...state,
        groups: nextGroups,
        myGroups: {
          ...state.myGroups,
          joined: state.myGroups.joined.filter(
            (id) => !(id === groupId && memberId),
          ),
        },
      };
    }

    case GROUPS_ACTIONS.DISSOLVE_GROUP: {
      const { groupId } = action.payload;
      if (!state.myGroups.hosted.includes(groupId)) return state;

      return {
        ...state,
        groups: state.groups.map((group) =>
          group.id === groupId ? { ...group, status: "closed" } : group,
        ),
        applications: (state.applications ?? []).filter(
          (app) => app.groupId !== groupId,
        ),
        myGroups: {
          ...state.myGroups,
          hosted: state.myGroups.hosted.filter((id) => id !== groupId),
          pending: (state.myGroups.pending ?? []).filter((id) => id !== groupId),
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
            : addUnique(state.myGroups.followed, groupId),
        },
      };
    }

    case GROUPS_ACTIONS.UPDATE_GROUP: {
      const { groupId, patch } = action.payload;
      return {
        ...state,
        groups: state.groups.map((group) => {
          if (group.id !== groupId) return group;
          const updated = { ...group, ...patch };
          if (patch.totalSlots != null || patch.takenSlots != null) {
            updated.status = calculateGroupStatus(updated.totalSlots, updated.takenSlots);
          }
          return updated;
        }),
      };
    }

    default:
      return state;
  }
}
