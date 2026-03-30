import { calculatePricePerSeat } from "../../../../data/services.config.js";

export function formatCreateGroupSeatPrice(serviceId, planId, billingCycle) {
  const rawSeatPrice = calculatePricePerSeat(serviceId, planId);
  if (rawSeatPrice == null) return "尚未選定";

  const normalizedPrice = billingCycle === "yearly" ? rawSeatPrice / 12 : rawSeatPrice;
  return `每位 NT$ ${Math.round(normalizedPrice)} / 月`;
}
