import { getServiceById, getPlanById, calculatePricePerSeat } from "../../../../data/services.config.js";

export function getPlanSummary(serviceId, planId) {
  const service = getServiceById(serviceId);
  const plan = getPlanById(serviceId, planId);

  if (!service || !plan) return null;

  return {
    service,
    plan,
    shortHighlights: (plan.highlights || []).slice(0, 3),
    fullFeatures: plan.features || [],
    officialLink: plan.officialLink || service.officialUrl,
  };
}

export function getPricePerSeatLabel(serviceId, planId) {
  const plan = getPlanById(serviceId, planId);
  const pricePerSeat = calculatePricePerSeat(serviceId, planId);

  if (!plan || pricePerSeat == null) return null;

  const period = plan.billingCycle === "monthly" ? "月" : "年";
  const formatted =
    plan.currency === "TWD"
      ? `NT$${Math.round(pricePerSeat)} / ${period}`
      : `US$${pricePerSeat.toFixed(2)} / ${period}`;

  return formatted;
}

export function getGroupOccupancy(group) {
  const plan = getPlanById(group?.serviceId, group?.planId);
  const totalSeats = plan?.totalSeats ?? group?.totalSlots ?? 0;
  const takenSlots = group?.takenSlots ?? 0;
  const remainingSeats = Math.max(0, totalSeats - takenSlots);
  const progress = totalSeats > 0 ? takenSlots / totalSeats : 0;

  return {
    totalSeats,
    takenSlots,
    remainingSeats,
    progress,
  };
}

export function getRemainingSeatStatusTheme(remainingSeats) {
  if (remainingSeats <= 1) {
    return {
      progressFillClassName: "bg-red-500",
      textClassName: "text-red-600",
      subtleTextClassName: "text-red-700",
    };
  }

  if (remainingSeats <= 3) {
    return {
      progressFillClassName: "bg-amber-400",
      textClassName: "text-amber-600",
      subtleTextClassName: "text-amber-700",
    };
  }

  return {
    progressFillClassName: "bg-emerald-500",
    textClassName: "text-emerald-600",
    subtleTextClassName: "text-emerald-700",
  };
}
