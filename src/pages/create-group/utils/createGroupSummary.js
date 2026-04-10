import { getPlanSummary, getPricePerSeatLabel } from "../../../shared/modules/groups/utils/groupSummary.js";
import {
  CREATE_GROUP_JOIN_POLICY_OPTIONS,
  getCreateGroupOptionLabel,
} from "./createGroupDefaults.js";

const STEP_SUMMARY_META = [
  {
    label: "第 1 步 / 4",
    title: "選擇服務",
    fallbackHint: "先挑選想建立的共享服務。",
  },
  {
    label: "第 2 步 / 4",
    title: "選擇方案",
    fallbackHint: "根據服務挑選適合的共享方案。",
  },
  {
    label: "第 3 步 / 4",
    title: "群組設定",
    fallbackHint: "設定招募名額、加入條件與申請須知。",
  },
  {
    label: "第 4 步 / 4",
    title: "確認建立內容",
    fallbackHint: "確認所有設定後即可建立群組。",
  },
];

export function buildCreateGroupSummaryData({ service, plan, derived, step = 0, form }) {
  const summary = getPlanSummary(service?.id, plan?.id);
  const totalSeats = summary?.plan.totalSeats ?? derived?.totalSeats ?? null;
  const reservedSeats =
    totalSeats != null && derived?.availableSeats != null
      ? totalSeats - derived.availableSeats
      : null;
  const pricePerSeatLabel =
    getPricePerSeatLabel(service?.id, plan?.id) ?? derived?.pricePerSeatLabel ?? "--";
  const stepMeta = STEP_SUMMARY_META[step] ?? STEP_SUMMARY_META[0];
  const serviceLabel = summary?.service.name ?? service?.name ?? "尚未選擇服務";
  const planLabel = summary?.plan.name ?? plan?.name ?? "尚未選擇方案";
  const joinPolicyLabel = getCreateGroupOptionLabel(
    CREATE_GROUP_JOIN_POLICY_OPTIONS,
    form?.joinPolicy,
    "尚未設定",
  );

  let stepHint = stepMeta.fallbackHint;

  if (step === 0 && service && plan) {
    stepHint = `目前正在為 ${service.shortLabel ?? service.name} 建立新的共享團。`;
  }

  if (step === 1 && service && plan) {
    stepHint = `目前已選擇 ${service.shortLabel ?? service.name} 的 ${plan.name}，接著可以設定招募名額。`;
  }

  if (step === 2 && derived?.availableSeats != null) {
    const descriptionReady = Boolean(form?.groupDescription);
    const ruleReady = Boolean(form?.memberRule);

    if (descriptionReady && ruleReady) {
      stepHint = `目前預計開放 ${derived.availableSeats} 個名額，群組概覽與申請須知都已經準備好了。`;
    } else {
      stepHint = `目前預計開放 ${derived.availableSeats} 個名額，接著整理加入條件與群組說明。`;
    }
  }

  if (step === 3) {
    stepHint = "這一步會整理成最終公開樣貌，確認無誤後即可建立群組。";
  }

  let stepActionLabel = "請先完成目前步驟。";

  if (step === 0) {
    stepActionLabel = service
      ? "服務已選定，下一步會顯示對應方案。"
      : "請先選擇服務，下一步才會出現方案。";
  }

  if (step === 1) {
    stepActionLabel = plan
      ? "方案已選定，下一步就能開始整理群組設定。"
      : "請先選一個方案，才能進入群組設定。";
  }

  if (step === 2) {
    stepActionLabel = "整理好名額、概覽與加入條件後，就能進入最後確認。";
  }

  if (step === 3) {
    stepActionLabel = "確認所有設定後即可建立群組。";
  }

  const seatSummaryText =
    totalSeats != null && derived?.availableSeats != null
      ? `總 ${totalSeats} 位 · 開放 ${derived.availableSeats} · 預留 ${reservedSeats ?? 0}`
      : "完成設定後會顯示席次摘要";

  return {
    summary,
    service,
    plan,
    step,
    stepLabel: stepMeta.label,
    stepTitle: stepMeta.title,
    stepHint,
    serviceLabel,
    planLabel,
    officialPriceText: summary?.plan.priceLabel ?? "--",
    billingNote: summary?.plan.billingNote ?? derived?.billingCycleLabel ?? "--",
    totalSeats,
    availableSeats: derived?.availableSeats ?? null,
    reservedSeats,
    pricePerSeatLabel,
    seatSummaryText,
    stepActionLabel,
    joinPolicyLabel,
    shortHighlights: summary?.shortHighlights ?? [],
    fullFeatures: summary?.fullFeatures ?? [],
    notes: summary?.plan.notes ?? "",
    officialLink: summary?.officialLink ?? "",
  };
}
