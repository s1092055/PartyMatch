export function buildPreviewGroupId(form) {
  return `__preview__:${form.serviceId}:${form.planName}:${form.totalSeats}:${form.billingCycle}`
}
