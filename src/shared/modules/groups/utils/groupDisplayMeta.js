import { getPlanById, getServiceById } from "../../../../data/services.config.js";

export function formatGroupCreatedDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getGroupStatusBadge(status) {
  const map = {
    open: { label: "招募中", tone: "green" },
    active: { label: "招募中", tone: "green" },
    recruiting: { label: "招募中", tone: "green" },
    almost_full: { label: "快額滿", tone: "yellow" },
    pending_payment: { label: "待確認", tone: "yellow" },
    pending: { label: "待確認", tone: "yellow" },
    draft: { label: "儲存草稿", tone: "blue" },
    full: { label: "已額滿", tone: "gray" },
    closed: { label: "已關閉", tone: "gray" },
    expired: { label: "已結束", tone: "gray" },
    archived: { label: "已封存", tone: "gray" },
    dissolved: { label: "已解散", tone: "red" },
  };

  return map[status] ?? { label: "招募中", tone: "green" };
}

export function getGroupViewMeta(group) {
  const service = getServiceById(group.serviceId ?? group.platform);
  const plan = getPlanById(group.serviceId, group.planId);
  const badge = getGroupStatusBadge(group.status);

  return { service, plan, badge };
}
