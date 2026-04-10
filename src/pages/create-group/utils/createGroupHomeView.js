import { getPlanById, getServiceById } from "../../../data/services.config.js";

export {
  formatGroupCreatedDate as formatCreateGroupCreatedDate,
  getGroupStatusBadge as getCreateGroupStatusBadge,
  getGroupViewMeta as getCreateGroupViewMeta,
} from "../../../shared/modules/groups/utils/groupDisplayMeta.js";

export function buildCreateGroupDraftListEntry(draft) {
  if (!draft) return null;

  const service = getServiceById(draft.form?.serviceId);
  const plan = getPlanById(draft.form?.serviceId, draft.form?.planId);
  const title = draft.form?.groupDescription?.trim() || "繼續完成這份群組草稿";

  return {
    kind: "draft",
    id: "draft-current",
    title,
    createdAt: draft.savedAt,
    status: "draft",
    serviceId: draft.form?.serviceId ?? "",
    platform: service?.name ?? "未選擇服務",
    iconKey: draft.form?.serviceId ?? "",
    planId: draft.form?.planId ?? "",
    billingCycle: plan?.billingCycle ?? "monthly",
    availableSeats:
      draft.form?.availableSeats === "" || draft.form?.availableSeats == null
        ? null
        : Number(draft.form.availableSeats),
    totalSlots: plan?.totalSeats ?? null,
    draft,
  };
}
