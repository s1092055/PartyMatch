import { getServiceIconKey, normalizeServiceId } from "../../../../data/services.config.js";

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function mapGroupDataToGroupRecord(groupData, user) {
  const totalSlots = toNumber(groupData.totalSlots ?? groupData.maxMembers, 1);
  const takenSlots = toNumber(
    groupData.takenSlots ?? groupData.currentMembers,
    Math.max(1, totalSlots - toNumber(groupData.availableSeats, totalSlots - 1)),
  );

  return {
    id: groupData.id,
    title: groupData.title.trim(),
    platform: groupData.platform.trim(),
    serviceId: normalizeServiceId(groupData.serviceId ?? groupData.platform),
    iconKey: groupData.iconKey ?? getServiceIconKey(groupData.serviceId ?? groupData.platform),
    planId: groupData.planId ?? "",
    plan: groupData.plan ?? "",
    price: toNumber(groupData.price),
    totalSlots,
    takenSlots,
    availableSeats: Math.max(0, totalSlots - takenSlots),
    ownerId: user.uid,
    ownerEmail: user.email ?? "",
    hostName: user.displayName ?? user.email ?? "你",
    description: (groupData.description ?? "").trim(),
    memberRule: (groupData.memberRule ?? "").trim(),
    joinPolicy: groupData.joinPolicy ?? "review",
    paymentReminder: groupData.paymentReminder ?? "three_days_before",
    contactMethod: groupData.contactMethod ?? "line",
    status: groupData.status ?? "recruiting",
    imageUrl: groupData.imageUrl ?? "",
    category: groupData.category ?? "",
    tags: Array.isArray(groupData.tags) ? groupData.tags : ["新建立"],
    role: "host",
    nextPaymentDate: groupData.nextPaymentDate ?? "",
    renewInDays: groupData.renewInDays ?? 0,
    createdAt: groupData.createdAt ?? new Date().toISOString(),
  };
}
