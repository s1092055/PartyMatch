import {
  calculatePricePerSeat,
  getPlanById,
  getServiceById,
  getServiceIconKey,
  normalizeServiceId,
} from "../../../../data/services.config.js";
import { calculateGroupStatus } from "../state/groupsTypes.js";

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toIsoDate(value) {
  if (!value) return "";
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

export function normalizeGroup(id, data) {
  const serviceId = normalizeServiceId(data.serviceId ?? data.platform);
  const service = getServiceById(serviceId);
  const plan = getPlanById(serviceId, data.planId);
  const takenSlots = toNumber(
    data.takenSlots ?? data.currentMembers ?? data.joinedSeats,
    1,
  );
  const totalSlots = toNumber(
    data.totalSlots ?? data.maxMembers ?? takenSlots,
    takenSlots,
  );
  const price = toNumber(
    data.price ?? data.pricePerMonth ?? data.pricePerSeat,
    0,
  );
  const calculatedSeatPrice = calculatePricePerSeat(serviceId, data.planId);
  const pricePerSeat = Number.isFinite(calculatedSeatPrice)
    ? Math.round(calculatedSeatPrice)
    : price;
  const createdAt = toIsoDate(data.createdAt);
  const explicitStatus = data.status && data.status !== "open" && data.status !== "almost_full" && data.status !== "full"
    ? data.status
    : null;

  return {
    id,
    title: data.title ?? "未命名群組",
    platform: data.platform ?? service?.name ?? data.serviceId ?? "未分類平台",
    serviceId,
    iconKey: data.iconKey ?? getServiceIconKey(serviceId),
    planId: data.planId ?? "",
    plan: data.plan ?? plan?.name ?? "",
    price,
    totalSlots,
    takenSlots,
    availableSeats: Math.max(0, totalSlots - takenSlots),
    ownerId: data.ownerId ?? "",
    ownerEmail: data.ownerEmail ?? data.hostName ?? data.host ?? "",
    hostName: data.hostName ?? data.ownerEmail ?? data.host ?? "匿名團主",
    description: data.description ?? data.groupDescription ?? "",
    memberRule: data.memberRule ?? "",
    joinPolicy: data.joinPolicy ?? "review",
    paymentReminder: data.paymentReminder ?? "three_days_before",
    contactMethod: data.contactMethod ?? "line",
    createdAt,
    nextPaymentDate: data.nextPaymentDate ?? "",
    renewInDays: data.renewInDays ?? 0,
    imageUrl: data.imageUrl ?? "",
    category: data.category ?? "",
    status: explicitStatus ?? calculateGroupStatus(totalSlots, takenSlots),
    tags:
      Array.isArray(data.tags) && data.tags.length > 0
        ? data.tags
        : data.isMock
          ? ["Demo"]
          : [],
    role: data.role ?? "none",
    isApplied: Boolean(data.isApplied),
    isMock: Boolean(data.isMock),
    pricePerSeat,
    pricePerMonth: price,
    currency: plan?.currency ?? data.currency ?? "TWD",
    billingCycle: plan?.billingCycle ?? data.billingCycle ?? "monthly",
    officialPrice: plan?.price ?? data.officialPrice ?? price,
    officialPriceLabel: plan?.priceLabel ?? data.officialPriceLabel ?? "",
  };
}

export function sortGroupsByCreatedAtDesc(groups) {
  return [...groups].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}
