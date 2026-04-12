export function buildPreviewGroupId(form) {
  return `__preview__:${form.serviceId}:${form.planName}:${form.recruitHeadcount}:${form.billingCycle}`
}
