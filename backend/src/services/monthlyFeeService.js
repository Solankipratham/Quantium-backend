import { toDate, addMonths, daysBetween } from "./dates.js";

function monthKey(d) {
  const dt = toDate(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d) {
  const dt = toDate(d);
  return dt.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function dueDateForMonth(student, y, m) {
  const day = Number(student.monthlyDueDate) || 10;
  const d = new Date(y, m, Math.min(day, 28), 23, 59, 59, 999);
  return d;
}

export function getMonthlyRecords(student, payments = [], opts = {}) {
  const monthlyFee = Number(student.monthlyFee) || 0;
  if (!monthlyFee) return [];
  const joining = toDate(student.joiningDate) || toDate(student.createdAt) || new Date();
  const start = new Date(joining.getFullYear(), joining.getMonth(), 1);
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + (opts.futureMonths ?? 3), 1);
  const records = [];
  // group payments by monthKey via date
  const byMonth = {};
  for (const p of payments) {
    const k = monthKey(p.date);
    byMonth[k] = (byMonth[k] || 0) + (Number(p.amount) || 0);
  }
  let cursor = new Date(start);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const k = `${y}-${String(m + 1).padStart(2, "0")}`;
    const due = dueDateForMonth(student, y, m);
    const paid = byMonth[k] || 0;
    const remaining = Math.max(0, monthlyFee - paid);
    const isFuture = cursor > new Date(now.getFullYear(), now.getMonth(), 1);
    const status = computeMonthStatus({ paid, monthlyFee, dueDate: due, isFuture });
    const daysRemaining = Math.ceil((due - new Date()) / 86400000);
    records.push({
      monthKey: k,
      label: monthLabel(cursor),
      dueDate: due,
      monthlyFee,
      paid,
      remaining,
      status,
      daysRemaining,
      payments: payments.filter((p) => monthKey(p.date) === k),
    });
    cursor = addMonths(cursor, 1);
  }
  return records;
}

function computeMonthStatus({ paid, monthlyFee, dueDate, isFuture }) {
  if (isFuture) return "Upcoming";
  if (paid >= monthlyFee) return "Paid";
  if (paid > 0 && paid < monthlyFee) {
    // partial but check overdue
    const overdue = isOverdue(dueDate);
    return overdue ? "Partially Paid" : "Partially Paid";
  }
  // unpaid
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueSod = new Date(dueDate);
  dueSod.setHours(0, 0, 0, 0);
  const diff = Math.round((dueSod - today) / 86400000);
  if (diff > 5) return "Upcoming";
  if (diff >= 1 && diff <= 5) return "Due Soon";
  if (diff === 0) return "Due Today";
  return "Overdue";
}

function isOverdue(dueDate) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const d = new Date(dueDate);
  d.setHours(23, 59, 59, 999);
  return d < today;
}

export function getPendingMonthlyRecords(student, payments) {
  const recs = getMonthlyRecords(student, payments);
  // Only months up to current month that are not Paid and not Upcoming
  const nowKey = monthKey(new Date());
  return recs.filter((r) => r.monthKey <= nowKey && r.remaining > 0 && r.status !== "Upcoming");
}

export function getDashboardMonthlyStats(enrichedStudents) {
  // For dashboard: count Due Soon, Overdue, Paid etc. based on current month record
  let dueSoon = 0, overdue = 0, paid = 0, partial = 0, pending = 0;
  for (const s of enrichedStudents) {
    const rec = s.monthlyRecords?.find((r) => r.monthKey === monthKey(new Date()));
    if (!rec) continue;
    if (rec.status === "Paid") paid++;
    else if (rec.status === "Partially Paid") partial++;
    else if (rec.status === "Due Soon") dueSoon++;
    else if (rec.status === "Due Today") dueSoon++;
    else if (rec.status === "Overdue") overdue++;
    if (rec.remaining > 0) pending++;
  }
  return { dueSoon, overdue, paid, partial, pending };
}
