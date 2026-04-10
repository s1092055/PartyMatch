export function formatMoney(value, currency = "TWD") {
  const n = Number(value);
  if (Number.isNaN(n)) return `${currency} --`;
  return new Intl.NumberFormat("zh-TW").format(n);
}

export function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatSavedAt(savedAt, fallback = "") {
  if (!savedAt) return fallback;

  try {
    return new Intl.DateTimeFormat("zh-TW", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(savedAt));
  } catch {
    return fallback;
  }
}
