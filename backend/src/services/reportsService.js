import { getStore } from "../data/store.js";
import { enrichStudent } from "./studentService.js";
import { toDate, startOfDay, endOfDay, startOfMonth, endOfMonth, monthKey, monthLabel } from "./dates.js";

export async function studentReport() {
  const store = await getStore();
  const students = await store.model("Student").find({ is_deleted: { $ne: true } }, { name: 1 });
  const enriched = await Promise.all(students.map((s) => enrichStudent(s)));
  return {
    total: enriched.length,
    active: enriched.filter((s) => s.status !== "Inactive").length,
    inactive: enriched.filter((s) => s.status === "Inactive").length,
    students: enriched
  };
}

export async function feeReport() {
  const store = await getStore();
  const students = await store.model("Student").find({ is_deleted: { $ne: true } }, null);
  const enriched = await Promise.all(students.map((s) => enrichStudent(s)));
  return {
    paid: enriched.filter((s) => s.status === "PAID").length,
    partial: enriched.filter((s) => s.status === "PARTIAL").length,
    pending: enriched.filter((s) => s.status === "PENDING").length,
    overdue: enriched.filter((s) => s.status === "OVERDUE").length,
    totalPending: enriched.reduce((s, st) => s + st.pending, 0),
    totalCollected: enriched.reduce((s, st) => s + st.paid, 0),
    totalExpected: enriched.reduce((s, st) => s + st.finalFee, 0)
  };
}

export async function collectionReport(period = "monthly") {
  const store = await getStore();
  const payments = await store.model("Payment").find({}, { date: 1 });

  if (period === "daily") {
    const buckets = {};
    for (const p of payments) {
      const d = toDate(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + Number(p.amount || 0);
    }
    return Object.keys(buckets)
      .sort()
      .map((k) => ({ key: k, label: k, total: buckets[k] }));
  }

  if (period === "weekly") {
    const buckets = {};
    for (const p of payments) {
      const d = toDate(p.date);
      const weekStart = new Date(d);
      const day = (d.getDay() + 6) % 7;
      weekStart.setDate(d.getDate() - day);
      const key = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() - 1 + weekStart.getDay()) / 7) || 1).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + Number(p.amount || 0);
    }
    return Object.keys(buckets)
      .sort()
      .map((k) => ({ key: k, label: k, total: buckets[k] }));
  }

  const buckets = {};
  for (const p of payments) {
    const key = monthKey(p.date);
    buckets[key] = (buckets[key] || 0) + Number(p.amount || 0);
  }
  return Object.keys(buckets)
    .sort()
    .map((k) => ({ key: k, label: monthLabel(new Date(k + "-01")), total: buckets[k] }));
}

export async function batchReport() {
  const store = await getStore();
  const [batches, students] = await Promise.all([
    store.model("Batch").find({ is_deleted: { $ne: true } }, null),
    store.model("Student").find({ is_deleted: { $ne: true } }, null)
  ]);
  const enriched = await Promise.all(students.map((s) => enrichStudent(s)));
  return batches.map((b) => {
    const members = enriched.filter((s) => s.batch === b.name);
    return {
      ...b,
      studentCount: members.length,
      collected: members.reduce((s, m) => s + m.paid, 0),
      pending: members.reduce((s, m) => s + m.pending, 0),
      collectionPercent: members.reduce((s, m) => s + m.finalFee, 0) > 0
        ? Math.round((members.reduce((s, m) => s + m.paid, 0) / members.reduce((s, m) => s + m.finalFee, 0)) * 100)
        : 0
    };
  });
}

export async function paymentMethodReport(from, to) {
  const store = await getStore();
  let filter = {};
  if (from) filter.date = { $gte: toDate(from) };
  if (to) filter.date = { ...(filter.date || {}), $lte: toDate(to) };
  const payments = await store.model("Payment").find(filter, null);
  const byMethod = {};
  for (const p of payments) {
    byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount || 0);
  }
  return {
    cash: byMethod.Cash || 0,
    upi: byMethod.UPI || 0,
    bankTransfer: byMethod["Bank Transfer"] || 0,
    card: byMethod.Card || 0,
    other: byMethod.Other || 0,
    total: payments.reduce((s, p) => s + Number(p.amount || 0), 0),
    count: payments.length,
    breakdown: Object.keys(byMethod).map((m) => ({ method: m, amount: byMethod[m] }))
  };
}

export async function paymentsLedger(filter = {}) {
  const store = await getStore();
  return store.model("Payment").find(filter, { date: -1 });
}