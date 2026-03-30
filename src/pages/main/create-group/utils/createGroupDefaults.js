export const CREATE_GROUP_EMPTY_FORM = {
  serviceId: "",
  planId: "",
  availableSeats: "",
  groupDescription: "",
  memberRule: "",
  joinPolicy: "",
  paymentReminder: "three_days_before",
  contactMethod: "line",
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

export const CREATE_GROUP_CONTACT_OPTIONS = [
  {
    value: "line",
    label: "LINE / 私訊",
    description: "最適合台灣常見的小型共享團。",
  },
  {
    value: "discord",
    label: "Discord / 社群",
    description: "適合遊戲、創作者或長期經營的群組。",
  },
  {
    value: "email",
    label: "Email / 表單",
    description: "適合資訊要留下書面紀錄的共享流程。",
  },
];

export function getCreateGroupOptionLabel(options, value, fallback = "--") {
  return options.find((option) => option.value === value)?.label ?? fallback;
}
