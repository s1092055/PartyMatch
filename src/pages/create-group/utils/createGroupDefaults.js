import {
  buildContactMethodTemplate,
  CONTACT_METHOD_META,
} from "../../../shared/modules/groups/utils/contactMethodTemplate.js";

export const CREATE_GROUP_EMPTY_FORM = {
  serviceId: "",
  planId: "",
  availableSeats: "",
  groupDescription: "",
  memberRule: "",
  joinPolicy: "",
  paymentReminder: "",
  contactMethod: "",
  contactMethodTemplate: buildContactMethodTemplate(""),
};

export const CREATE_GROUP_JOIN_POLICY_OPTIONS = [
  {
    value: "instant",
    label: "立即加入",
    description: "成員申請後自動加入",
  },
  {
    value: "review",
    label: "需先審核",
    description: "需由團主同意後加入。",
  },
];

export const CREATE_GROUP_REMINDER_OPTIONS = [
  {
    value: "three_days_before",
    label: "到期前三天提醒",
    description: "給成員較充裕的轉帳與確認時間。",
  },
  {
    value: "day_before",
    label: "前一天提醒",
    description: "適合節奏穩定、成員熟悉流程的團。",
  },
  {
    value: "same_day",
    label: "扣款當天提醒",
    description: "只保留最精簡的提醒節奏。",
  },
];

export const CREATE_GROUP_CONTACT_OPTIONS = Object.entries(CONTACT_METHOD_META).map(
  ([value, meta]) => ({
    value,
    label: meta.label,
    description: meta.description,
  }),
);

export const CONTACT_METHOD_CONFIG = Object.fromEntries(
  Object.entries(CONTACT_METHOD_META).map(([value, meta]) => [
    value,
    {
      label: meta.fieldLabel,
      hint: meta.hint,
      placeholder: meta.placeholder,
      prefix: meta.prefix,
    },
  ]),
);

export function getCreateGroupOptionLabel(options, value, fallback = "--") {
  return options.find((option) => option.value === value)?.label ?? fallback;
}
