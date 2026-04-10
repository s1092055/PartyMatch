import { mapGroupDataToGroupRecord } from "../utils/groupMappers.js";
import { GROUPS_MOCK } from "../../../../data/groups.mock.js";
import {
  normalizeGroup,
  sortGroupsByCreatedAtDesc,
} from "../utils/groupNormalizer.js";
import {
  APPLICATION_STATUS,
  JOIN_POLICY,
} from "../state/groupsTypes.js";
import { getRegisteredUsers } from "../../auth/services/authService.js";

const GROUP_API_STORAGE_KEY = "partymatch_group_api_store";
const GROUP_API_SCHEMA_VERSION = 1;

const DEFAULT_DELAY_MS = 350;
const DRAFT_DELAY_MS = 160;

let memoryStore = null;

function delay(ms = DEFAULT_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isFormalGroupRecord(group) {
  if (!group) return false;
  if (group.isMock) return false;
  return group.status !== "dissolved";
}

function getSeedGroups() {
  return clone(GROUPS_MOCK);
}

function mergeSeedGroups(groups) {
  const nextGroups = Array.isArray(groups) ? [...groups] : [];
  const existingIds = new Set(
    nextGroups
      .map((group) => group?.id)
      .filter((id) => typeof id === "string" && id),
  );

  getSeedGroups().forEach((group) => {
    if (!existingIds.has(group.id)) {
      nextGroups.push(group);
    }
  });

  return nextGroups;
}

function buildEmptyStore() {
  return {
    version: GROUP_API_SCHEMA_VERSION,
    groups: getSeedGroups(),
    userStates: {},
    applications: [],
    drafts: [],
  };
}

function normalizeIdList(list, validIds = null) {
  const uniqueIds = Array.from(
    new Set((Array.isArray(list) ? list : []).filter((id) => typeof id === "string")),
  );

  if (!validIds) return uniqueIds;
  return uniqueIds.filter((id) => validIds.has(id));
}

function normalizeUserState(userState, validIds) {
  return {
    joined: normalizeIdList(userState?.joined, validIds),
    followed: normalizeIdList(userState?.followed, validIds),
    pending: normalizeIdList(userState?.pending, validIds),
  };
}

function normalizeApplication(application, validIds) {
  if (
    !application ||
    typeof application.id !== "string" ||
    typeof application.groupId !== "string" ||
    typeof application.userId !== "string" ||
    !validIds.has(application.groupId)
  ) {
    return null;
  }

  return {
    id: application.id,
    groupId: application.groupId,
    userId: application.userId,
    displayName:
      typeof application.displayName === "string" && application.displayName.trim()
        ? application.displayName.trim()
        : "匿名使用者",
    status:
      application.status === APPLICATION_STATUS.APPROVED ||
      application.status === APPLICATION_STATUS.REJECTED
        ? application.status
        : APPLICATION_STATUS.PENDING,
    createdAt:
      typeof application.createdAt === "string" && application.createdAt
        ? application.createdAt
        : new Date().toISOString(),
    introduction: typeof application.introduction === "string" ? application.introduction : "",
    contact: typeof application.contact === "string" ? application.contact : "",
    paymentMethod:
      typeof application.paymentMethod === "string" ? application.paymentMethod : "",
  };
}

function normalizeDraft(draft) {
  const ownerId =
    typeof draft?.ownerId === "string" && draft.ownerId
      ? draft.ownerId
      : draft?.userId;

  if (!draft || typeof ownerId !== "string" || !ownerId) return null;

  return {
    id:
      typeof draft.id === "string" && draft.id
        ? draft.id
        : `draft-current-${ownerId}`,
    ownerId,
    step: Number.isFinite(Number(draft.step))
      ? Math.max(0, Math.min(3, Math.round(Number(draft.step))))
      : 0,
    form: draft.form && typeof draft.form === "object" ? { ...draft.form } : {},
    savedAt:
      typeof draft.savedAt === "string" && draft.savedAt
        ? draft.savedAt
        : new Date().toISOString(),
  };
}

function normalizeStore(store) {
  const fallback = buildEmptyStore();
  const mergedGroups = mergeSeedGroups(
    Array.isArray(store?.groups) ? store.groups : fallback.groups,
  );
  const normalizedGroups = sortGroupsByCreatedAtDesc(
    mergedGroups
      .map((group) => (group?.id ? normalizeGroup(group.id, group) : null))
      .filter(Boolean),
  ).filter(isFormalGroupRecord);
  const validIds = new Set(normalizedGroups.map((group) => group.id));

  const userStates = Object.fromEntries(
    Object.entries(store?.userStates ?? {})
      .filter(([userId]) => typeof userId === "string" && userId)
      .map(([userId, userState]) => [
        userId,
        normalizeUserState(userState, validIds),
      ]),
  );

  const applications = (Array.isArray(store?.applications) ? store.applications : [])
    .map((application) => normalizeApplication(application, validIds))
    .filter(Boolean);

  const drafts = (Array.isArray(store?.drafts) ? store.drafts : [])
    .map((draft) => normalizeDraft(draft))
    .filter(Boolean)
    .sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime());

  return {
    version: GROUP_API_SCHEMA_VERSION,
    groups: normalizedGroups,
    userStates,
    applications,
    drafts,
  };
}

function readStore() {
  if (canUseStorage()) {
    try {
      const raw = window.localStorage.getItem(GROUP_API_STORAGE_KEY);
      if (!raw) {
        const seededStore = buildEmptyStore();
        window.localStorage.setItem(GROUP_API_STORAGE_KEY, JSON.stringify(seededStore));
        return seededStore;
      }

      const parsed = JSON.parse(raw);
      if (parsed?.version !== GROUP_API_SCHEMA_VERSION) {
        const seededStore = buildEmptyStore();
        window.localStorage.setItem(GROUP_API_STORAGE_KEY, JSON.stringify(seededStore));
        return seededStore;
      }

      const normalized = normalizeStore(parsed);
      window.localStorage.setItem(GROUP_API_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    } catch {
      const seededStore = buildEmptyStore();
      window.localStorage.setItem(GROUP_API_STORAGE_KEY, JSON.stringify(seededStore));
      return seededStore;
    }
  }

  if (!memoryStore) {
    memoryStore = buildEmptyStore();
  }

  memoryStore = normalizeStore(memoryStore);
  return clone(memoryStore);
}

function writeStore(store) {
  const normalized = normalizeStore(store);

  if (canUseStorage()) {
    window.localStorage.setItem(GROUP_API_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  memoryStore = clone(normalized);
  return normalized;
}

function getGroupIndex(store, groupId) {
  return store.groups.findIndex((group) => group.id === groupId);
}

function getExistingGroup(store, groupId) {
  const index = getGroupIndex(store, groupId);
  if (index < 0) return { group: null, index: -1 };
  return { group: store.groups[index], index };
}

function getUserState(store, userId) {
  if (!userId) {
    return { joined: [], followed: [], pending: [] };
  }

  return normalizeUserState(store.userStates[userId], new Set(store.groups.map((group) => group.id)));
}

function setUserState(store, userId, nextUserState) {
  if (!userId) return;
  store.userStates[userId] = normalizeUserState(
    nextUserState,
    new Set(store.groups.map((group) => group.id)),
  );
}

function buildStateSnapshot(store, userId = null) {
  const groups = sortGroupsByCreatedAtDesc(store.groups);
  const validIds = new Set(groups.map((group) => group.id));
  const currentUserState = normalizeUserState(store.userStates[userId], validIds);
  const hostedGroupIds = new Set(
    userId
      ? groups
          .filter((group) => group.ownerId === userId)
          .map((group) => group.id)
      : [],
  );

  return {
    groups,
    myGroups: {
      joined: currentUserState.joined,
      hosted: userId
        ? [...hostedGroupIds]
        : [],
      followed: currentUserState.followed,
      pending: currentUserState.pending,
    },
    applications: store.applications.filter(
      (application) =>
        validIds.has(application.groupId) &&
        Boolean(userId) &&
        (
          application.userId === userId ||
          hostedGroupIds.has(application.groupId)
        ),
    ),
  };
}

function ensureAuthenticatedUserId(userId, message) {
  if (!userId) {
    throw new Error(message);
  }
}

function ensureGroupCanBeJoined(group) {
  if (!group) {
    throw new Error("找不到這個群組。");
  }

  if (group.status === "closed" || group.status === "expired") {
    throw new Error("這個群組目前無法加入。");
  }

  if ((group.takenSlots ?? 0) >= (group.totalSlots ?? 0)) {
    throw new Error("這個群組目前已滿。");
  }
}

function updateStoredGroupRecord(currentGroup, patch) {
  return normalizeGroup(currentGroup.id, {
    ...currentGroup,
    ...patch,
  });
}

function generateGroupId(serviceId = "group") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `group-${serviceId}-${crypto.randomUUID()}`;
  }

  return `group-${serviceId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getAllGroups() {
  await delay();
  return clone(readStore().groups);
}

export async function getGroups(currentUserId = null) {
  await delay();

  if (!currentUserId) {
    return [];
  }

  return clone(
    readStore().groups.filter((group) => group.ownerId === currentUserId),
  );
}

export async function getGroupById(id) {
  await delay();
  if (!id) return null;

  const group = readStore().groups.find((item) => item.id === id) ?? null;
  return clone(group);
}

export async function getGroupMembers(groupId) {
  await delay(DRAFT_DELAY_MS);

  if (!groupId) return [];

  const store = readStore();
  const { group } = getExistingGroup(store, groupId);
  if (!group) return [];

  const validIds = new Set(store.groups.map((item) => item.id));
  const knownUsers = new Map(
    getRegisteredUsers().map((user) => [user.id, user]),
  );
  const approvedDisplayNames = new Map(
    store.applications
      .filter(
        (application) =>
          application.groupId === groupId &&
          application.status === APPLICATION_STATUS.APPROVED,
      )
      .map((application) => [application.userId, application.displayName]),
  );

  const joinedUserIds = Object.entries(store.userStates)
    .filter(([userId, userState]) =>
      normalizeUserState(userState, validIds).joined.includes(groupId) &&
      typeof userId === "string" &&
      userId,
    )
    .map(([userId]) => userId);

  const memberIds = Array.from(
    new Set([group.ownerId, ...joinedUserIds].filter(Boolean)),
  );

  const members = memberIds
    .map((userId) => {
      const knownUser = knownUsers.get(userId);
      const isOwner = userId === group.ownerId;
      const fallbackName = knownUser?.email?.split("@")[0] ?? `使用者 ${String(userId).slice(0, 8)}`;

      return {
        userId,
        displayName:
          (isOwner ? group.hostName : null) ??
          approvedDisplayNames.get(userId) ??
          knownUser?.displayName ??
          fallbackName,
        email: knownUser?.email ?? null,
        role: isOwner ? "團主" : "成員",
      };
    })
    .sort((left, right) => {
      if (left.role !== right.role) return left.role === "團主" ? -1 : 1;
      return left.displayName.localeCompare(right.displayName, "zh-Hant");
    });

  return clone(members);
}

export async function getGroupsState(userId = null) {
  await delay();
  return clone(buildStateSnapshot(readStore(), userId));
}

export async function createGroup(data, user) {
  await delay();

  const ownerId = user?.id ?? null;
  ensureAuthenticatedUserId(ownerId, "請先登入後再建立群組。");

  const store = readStore();
  const nextRecord = mapGroupDataToGroupRecord(
    {
      ...data,
      id: data.id ?? generateGroupId(data.serviceId ?? data.platform),
      title: data.title ?? "未命名群組",
      platform: data.platform ?? data.serviceId ?? "未知服務",
      tags:
        Array.isArray(data.tags) && data.tags.length > 0
          ? data.tags
          : ["新建立", "本地示範"],
      createdAt: new Date().toISOString(),
      ownerId,
    },
    { ...user, id: ownerId, uid: ownerId },
  );

  store.groups = sortGroupsByCreatedAtDesc([
    normalizeGroup(nextRecord.id, nextRecord),
    ...store.groups.filter((group) => group.id !== nextRecord.id),
  ]);

  writeStore(store);
  return clone(store.groups[0]);
}

export async function updateGroup(id, data) {
  await delay();

  const store = readStore();
  const { group, index } = getExistingGroup(store, id);
  if (!group || index < 0) {
    throw new Error("找不到要更新的群組。");
  }

  store.groups[index] = updateStoredGroupRecord(group, data);
  writeStore(store);

  return clone(store.groups[index]);
}

export async function deleteGroup(id) {
  await delay();

  const store = readStore();
  const existingGroup = store.groups.find((group) => group.id === id) ?? null;
  if (!existingGroup) return null;

  store.groups = store.groups.filter((group) => group.id !== id);
  store.applications = store.applications.filter((application) => application.groupId !== id);

  Object.keys(store.userStates).forEach((userId) => {
    const userState = getUserState(store, userId);
    setUserState(store, userId, {
      joined: userState.joined.filter((groupId) => groupId !== id),
      followed: userState.followed.filter((groupId) => groupId !== id),
      pending: userState.pending.filter((groupId) => groupId !== id),
    });
  });

  writeStore(store);
  return clone(existingGroup);
}

export async function getDrafts(currentUserId = null) {
  await delay(DRAFT_DELAY_MS);

  if (!currentUserId) {
    return [];
  }

  const drafts = readStore().drafts.filter(
    (draft) => draft.ownerId === currentUserId,
  );
  return clone(drafts);
}

export async function saveDraft(data) {
  await delay(DRAFT_DELAY_MS);

  const store = readStore();
  const record = normalizeDraft({
    ...data,
    id:
      typeof data?.id === "string" && data.id
        ? data.id
        : `draft-current-${data?.ownerId ?? data?.userId ?? "anonymous"}`,
    savedAt: new Date().toISOString(),
  });

  if (!record) {
    throw new Error("草稿資料不完整，無法儲存。");
  }

  const existingDraft = store.drafts.find((draft) => draft.id === record.id) ?? null;
  if (existingDraft && existingDraft.ownerId !== record.ownerId) {
    throw new Error("無法覆寫其他使用者的草稿。");
  }

  store.drafts = [
    record,
    ...store.drafts.filter((draft) => draft.id !== record.id),
  ].sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime());

  writeStore(store);
  return clone(record);
}

export async function deleteDraft(id, currentUserId) {
  await delay(120);

  if (!id) return null;
  ensureAuthenticatedUserId(currentUserId, "請先登入後再刪除草稿。");

  const store = readStore();
  const existingDraft =
    store.drafts.find(
      (draft) => draft.id === id && draft.ownerId === currentUserId,
    ) ?? null;
  if (!existingDraft) return null;

  store.drafts = store.drafts.filter(
    (draft) => !(draft.id === id && draft.ownerId === currentUserId),
  );
  writeStore(store);

  return clone(existingDraft);
}

export async function joinGroup(groupId, userId) {
  await delay();

  ensureAuthenticatedUserId(userId, "請先登入後再加入群組。");

  const store = readStore();
  const { group, index } = getExistingGroup(store, groupId);
  ensureGroupCanBeJoined(group);

  const userState = getUserState(store, userId);
  if (group.ownerId === userId || userState.joined.includes(groupId)) {
    return clone(group);
  }

  store.groups[index] = updateStoredGroupRecord(group, {
    takenSlots: Math.min(group.totalSlots, (group.takenSlots ?? 0) + 1),
  });
  setUserState(store, userId, {
    joined: [...userState.joined, groupId],
    followed: userState.followed,
    pending: userState.pending.filter((id) => id !== groupId),
  });

  writeStore(store);
  return clone(store.groups[index]);
}

export async function leaveGroup(groupId, userId) {
  await delay();

  ensureAuthenticatedUserId(userId, "請先登入後再退出群組。");

  const store = readStore();
  const { group, index } = getExistingGroup(store, groupId);
  if (!group || index < 0) return null;

  const userState = getUserState(store, userId);
  if (!userState.joined.includes(groupId)) {
    return clone(group);
  }

  store.groups[index] = updateStoredGroupRecord(group, {
    takenSlots: Math.max(0, (group.takenSlots ?? 0) - 1),
  });
  setUserState(store, userId, {
    joined: userState.joined.filter((id) => id !== groupId),
    followed: userState.followed,
    pending: userState.pending,
  });

  writeStore(store);
  return clone(store.groups[index]);
}

export async function toggleFollowGroup(groupId, userId) {
  await delay();

  ensureAuthenticatedUserId(userId, "請先登入後再追蹤群組。");

  const store = readStore();
  const { group } = getExistingGroup(store, groupId);
  if (!group) {
    throw new Error("找不到這個群組。");
  }

  const userState = getUserState(store, userId);
  const isFollowed = userState.followed.includes(groupId);

  setUserState(store, userId, {
    joined: userState.joined,
    followed: isFollowed
      ? userState.followed.filter((id) => id !== groupId)
      : [...userState.followed, groupId],
    pending: userState.pending,
  });

  writeStore(store);
  return clone(group);
}

export async function applyToGroup(groupId, payload) {
  await delay();

  const userId = payload?.userId;
  ensureAuthenticatedUserId(userId, "請先登入後再申請加入群組。");

  const store = readStore();
  const { group } = getExistingGroup(store, groupId);
  ensureGroupCanBeJoined(group);

  if (group.joinPolicy !== JOIN_POLICY.REVIEW) {
    throw new Error("這個群組不需要送出申請。");
  }

  const userState = getUserState(store, userId);
  if (
    group.ownerId === userId ||
    userState.joined.includes(groupId) ||
    userState.pending.includes(groupId)
  ) {
    return null;
  }

  const nextApplication = normalizeApplication(
    {
      id: `app-${groupId}-${userId}-${Date.now()}`,
      groupId,
      userId,
      displayName: payload?.displayName,
      status: APPLICATION_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      introduction: payload?.introduction,
      contact: payload?.contact,
      paymentMethod: payload?.paymentMethod,
    },
    new Set(store.groups.map((item) => item.id)),
  );

  store.applications = [...store.applications, nextApplication];
  setUserState(store, userId, {
    joined: userState.joined,
    followed: userState.followed,
    pending: [...userState.pending, groupId],
  });

  writeStore(store);
  return clone(nextApplication);
}

export async function cancelApplication(groupId, userId) {
  await delay();

  ensureAuthenticatedUserId(userId, "請先登入後再管理申請。");

  const store = readStore();
  const userState = getUserState(store, userId);

  store.applications = store.applications.filter(
    (application) =>
      !(
        application.groupId === groupId &&
        application.userId === userId &&
        application.status === APPLICATION_STATUS.PENDING
      ),
  );

  setUserState(store, userId, {
    joined: userState.joined,
    followed: userState.followed,
    pending: userState.pending.filter((id) => id !== groupId),
  });

  writeStore(store);
  return true;
}

export async function approveApplication(applicationId) {
  await delay();

  const store = readStore();
  const application = store.applications.find((item) => item.id === applicationId);
  if (!application || application.status !== APPLICATION_STATUS.PENDING) {
    return null;
  }

  const { group, index } = getExistingGroup(store, application.groupId);
  ensureGroupCanBeJoined(group);

  store.groups[index] = updateStoredGroupRecord(group, {
    takenSlots: Math.min(group.totalSlots, (group.takenSlots ?? 0) + 1),
  });
  store.applications = store.applications.map((item) =>
    item.id === applicationId
      ? { ...item, status: APPLICATION_STATUS.APPROVED }
      : item,
  );

  const applicantState = getUserState(store, application.userId);
  setUserState(store, application.userId, {
    joined: [...applicantState.joined, application.groupId],
    followed: applicantState.followed,
    pending: applicantState.pending.filter((id) => id !== application.groupId),
  });

  writeStore(store);
  return clone(store.groups[index]);
}

export async function rejectApplication(applicationId) {
  await delay();

  const store = readStore();
  const application = store.applications.find((item) => item.id === applicationId);
  if (!application || application.status !== APPLICATION_STATUS.PENDING) {
    return null;
  }

  store.applications = store.applications.map((item) =>
    item.id === applicationId
      ? { ...item, status: APPLICATION_STATUS.REJECTED }
      : item,
  );

  const applicantState = getUserState(store, application.userId);
  setUserState(store, application.userId, {
    joined: applicantState.joined,
    followed: applicantState.followed,
    pending: applicantState.pending.filter((id) => id !== application.groupId),
  });

  writeStore(store);
  return clone(application);
}
