export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function toDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function startOfDay(v) {
  const d = toDate(v) || new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(v) {
  const d = toDate(v) || new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(v) {
  const d = toDate(v) || new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(v) {
  const d = toDate(v) || new Date();
  const nd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  nd.setDate(0);
  nd.setHours(23, 59, 59, 999);
  return nd;
}

export function monthKey(d) {
  const date = toDate(d) || new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(d) {
  const date = toDate(d) || new Date();
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function addMonths(d, n) {
  const date = toDate(d) || new Date();
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

export function daysBetween(from, to) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / 86400000);
}

export function daysRemaining(dueDate) {
  if (!dueDate) return null;
  return daysBetween(new Date(), dueDate);
}

export function formatDate(d, opts = {}) {
  const date = toDate(d);
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts
  });
}

export function formatINR(n) {
  const num = Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

export function addDays(d, n) {
  const date = toDate(d) || new Date();
  date.setDate(date.getDate() + n);
  return date;
}

export function sameDay(a, b) {
  const da = startOfDay(a);
  const db = startOfDay(b);
  return da.getTime() === db.getTime();
}