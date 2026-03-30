import {
  calculatePricePerSeat,
  getServiceIconKey,
  normalizeServiceId,
} from "../../../../data/services.config.js";

export function mapCreateGroupFormToGroupPayload(formData, selectedService, selectedPlan) {
  const totalSlots = Number(selectedPlan?.totalSeats ?? 0);
  const availableSeats = Number(formData.availableSeats);
  const takenSlots = Math.max(0, totalSlots - availableSeats);
  const pricePerSeat = Math.round(
    calculatePricePerSeat(selectedService?.id, selectedPlan?.id) ??
      selectedPlan?.price ??
      0,
  );
  const groupDescription = formData.groupDescription.trim();
  const memberRule = formData.memberRule.trim();

  return {
    title: `${selectedService?.name ?? "Unknown"} ${selectedPlan?.name ?? "Plan"} Group`,
    platform: selectedService?.name ?? "",
    serviceId: normalizeServiceId(selectedService?.id),
    planId: selectedPlan?.id ?? "",
    iconKey: getServiceIconKey(selectedService?.id),
    price: pricePerSeat,
    totalSlots,
    availableSeats,
    takenSlots,
    description: groupDescription,
    memberRule,
    joinPolicy: formData.joinPolicy,
    paymentReminder: formData.paymentReminder,
    contactMethod: formData.contactMethod,
    status: "recruiting",
  };
}
