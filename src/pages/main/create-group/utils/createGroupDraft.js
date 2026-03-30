import { CREATE_GROUP_EMPTY_FORM } from "./createGroupDefaults.js";

export const CREATE_GROUP_DRAFT_STORAGE_KEY = "partymatch_create_group_draft";
const LEGACY_CREATE_GROUP_DRAFT_KEY = "pm-create-group-draft";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeForm(form) {
  return {
    ...CREATE_GROUP_EMPTY_FORM,
    ...(form && typeof form === "object" ? form : {}),
  };
}

function normalizeStep(step) {
  const numericStep = Number(step);
  if (!Number.isFinite(numericStep)) return 0;
  return Math.max(0, Math.min(3, Math.round(numericStep)));
}

export function loadCreateGroupDraft(userId) {
  if (!canUseStorage() || !userId) return null;

  try {
    const raw = window.localStorage.getItem(CREATE_GROUP_DRAFT_STORAGE_KEY);
    const draft = raw ? JSON.parse(raw) : null;

    window.localStorage.removeItem(LEGACY_CREATE_GROUP_DRAFT_KEY);

    if (!draft || typeof draft !== "object") return null;
    if (draft.userId !== userId) return null;

    return {
      step: normalizeStep(draft.step),
      form: normalizeForm(draft.form),
      savedAt: typeof draft.savedAt === "string" ? draft.savedAt : "",
      userId,
    };
  } catch {
    return null;
  }
}

export function saveCreateGroupDraft({ step, form, userId }) {
  if (!canUseStorage() || !userId) return null;

  const payload = {
    step: normalizeStep(step),
    form: normalizeForm(form),
    savedAt: new Date().toISOString(),
    userId,
  };

  window.localStorage.removeItem(LEGACY_CREATE_GROUP_DRAFT_KEY);
  window.localStorage.setItem(
    CREATE_GROUP_DRAFT_STORAGE_KEY,
    JSON.stringify(payload),
  );

  return payload;
}

export function clearCreateGroupDraft() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CREATE_GROUP_DRAFT_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_CREATE_GROUP_DRAFT_KEY);
}
