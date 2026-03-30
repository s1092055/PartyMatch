import { GROUPS_MOCK } from "../../../../data/groups.mock.js";
import { mapGroupDataToGroupRecord } from "../utils/groupMappers.js";
import { normalizeGroup, sortGroupsByCreatedAtDesc } from "../utils/groupNormalizer.js";

const LOCAL_GROUPS_STORAGE_KEY = "partymatch_demo_groups";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readStoredGroupRecords() {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(LOCAL_GROUPS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredGroupRecords(records) {
  if (!canUseStorage()) return;
  localStorage.setItem(LOCAL_GROUPS_STORAGE_KEY, JSON.stringify(records));
}

function mergeGroupsById(primaryGroups, secondaryGroups) {
  const seen = new Set();

  return [...primaryGroups, ...secondaryGroups].filter((group) => {
    if (!group?.id || seen.has(group.id)) return false;
    seen.add(group.id);
    return true;
  });
}

function getMockGroups() {
  return sortGroupsByCreatedAtDesc(
    GROUPS_MOCK.map((group) => normalizeGroup(group.id, group)),
  );
}

function getLocalGroups() {
  return sortGroupsByCreatedAtDesc(
    readStoredGroupRecords().map((group) => normalizeGroup(group.id, group)),
  );
}

function generateGroupId(serviceId = "group") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `group-${serviceId}-${crypto.randomUUID()}`;
  }

  return `group-${serviceId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getGroups() {
  return sortGroupsByCreatedAtDesc(
    mergeGroupsById(getLocalGroups(), getMockGroups()),
  );
}

export async function getGroupById(id) {
  if (!id) return null;

  const groups = await getGroups();
  return groups.find((group) => group.id === id) ?? null;
}

export async function createGroup(groupData, user) {
  if (!user?.uid) {
    throw new Error("請先登入後再建立群組。");
  }

  const nextRecord = mapGroupDataToGroupRecord(
    {
      ...groupData,
      id: groupData.id ?? generateGroupId(groupData.serviceId ?? groupData.platform),
      title: groupData.title ?? "未命名群組",
      platform: groupData.platform ?? groupData.serviceId ?? "未知服務",
      tags:
        Array.isArray(groupData.tags) && groupData.tags.length > 0
          ? groupData.tags
          : ["新建立", "本地示範"],
      createdAt: new Date().toISOString(),
    },
    user,
  );

  const currentRecords = readStoredGroupRecords().filter(
    (group) => group?.id && group.id !== nextRecord.id,
  );
  writeStoredGroupRecords([nextRecord, ...currentRecords]);

  return normalizeGroup(nextRecord.id, nextRecord);
}

export async function getGroupsByOwner(userId) {
  if (!userId) return [];

  const groups = await getGroups();
  return groups.filter((group) => group.ownerId === userId);
}

export async function updateStoredGroup(groupId, patch) {
  if (!groupId || !patch || typeof patch !== "object" || Array.isArray(patch) || Object.keys(patch).length === 0) return null;

  const currentRecords = readStoredGroupRecords();
  const nextRecords = currentRecords.map((group) =>
    group?.id === groupId ? { ...group, ...patch } : group,
  );

  if (nextRecords.every((group, index) => group === currentRecords[index])) {
    return null;
  }

  writeStoredGroupRecords(nextRecords);
  const nextRecord = nextRecords.find((group) => group?.id === groupId);
  return nextRecord ? normalizeGroup(nextRecord.id, nextRecord) : null;
}
