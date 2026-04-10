import { resolveContactMethodValue } from "../../../shared/modules/groups/utils/contactMethodTemplate.js";

export function validateCreateGroupStep({ step, formData, derived }) {
  const nextErrors = {};

  if (step === 0) {
    if (!formData.serviceId.trim()) nextErrors.serviceId = "請選擇服務。";
  }

  if (step === 1) {
    if (!formData.planId.trim()) nextErrors.planId = "請選擇方案。";
  }

  if (step === 2) {
    const seats = Number(formData.availableSeats);
    if (formData.availableSeats === "" || Number.isNaN(seats)) {
      nextErrors.availableSeats = "請填寫開放名額。";
    } else if (seats < (derived.minSeats ?? 1)) {
      nextErrors.availableSeats = "開放名額不得低於方案最小值。";
    } else if (derived.maxSeats != null && seats > derived.maxSeats) {
      nextErrors.availableSeats = "開放名額不得超過方案可共享席次上限。";
    }

    if (!String(formData.joinPolicy ?? "").trim()) {
      nextErrors.joinPolicy = "請設定加入條件。";
    }

    if (!String(formData.groupDescription ?? "").trim()) {
      nextErrors.groupDescription = "請填寫群組簡介。";
    }

    if (!String(formData.memberRule ?? "").trim()) {
      nextErrors.memberRule = "請填寫申請須知。";
    }

    if (!String(formData.paymentReminder ?? "").trim()) {
      nextErrors.paymentReminder = "請選擇付款提醒時間。";
    }

    if (
      !resolveContactMethodValue(
        formData.contactMethodTemplate ?? formData.contactMethod,
      )
    ) {
      nextErrors.contactMethod = "請選擇聯絡方式。";
    }
  }

  return nextErrors;
}
