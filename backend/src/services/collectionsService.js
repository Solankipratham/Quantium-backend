import { getStore } from "../data/store.js";
import { toDate, startOfDay, endOfDay, startOfMonth, endOfMonth, monthKey, monthLabel } from "./dates.js";
import { enrichStudent } from "./studentService.js";

export async function getDailyCollection(date) {
  const store = await getStore();
  const d = toDate(date || new Date());
  const payments = await store.model("Payment").find({}, { date: -1 });
  const dayPayments = payments.filter((p) => {
    const pd = toDate(p.date);
    return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && pd.getDate() === d.getDate();
  });
  const total = dayPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const methods = {};
  for (const p of dayPayments) {
    methods[p.method] = (methods[p.method] || 0) + Number(p.amount || 0);
  }
  return {
    date: d,
    total,
    count: dayPayments.length,
    cash: methods.Cash || 0,
    upi: methods.UPI || 0,
    bankTransfer: methods["Bank Transfer"] || 0,
    card: methods.Card || 0,
    other: methods.Other || 0,
    methods,
    payments: dayPayments.map((p) => ({ ...p, date: toDate(p.date) }))
  };
}

export async function getMonthlySummary(monthDate) {
  const store = await getStore();
  const date = toDate(monthDate || new Date());
  const from = startOfMonth(date);
  const to = endOfMonth(date);
  const [allStudents, payments] = await Promise.all([
    store.model("Student").find({ is_deleted: { $ne: true } }, null),
    store.model("Payment").find({}, { date: -1 })
  ]);
  const monthPayments = payments.filter((p) => {
    const pd = toDate(p.date);
    return pd >= from && pd <= to;
  });

  // Only currently-enrolled students are expected to pay for the month.
  const enrolled = allStudents.filter((s) => (s.status || "Active") !== "Inactive");
  const expectedFromStudents = enrolled.reduce((s, st) => s + (Number(st.monthlyFee) || 0), 0);
  const collected = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const enriched = await Promise.all(enrolled.map((s) => enrichStudent(s)));
  const overdue = enriched.filter((s) => s.pending > 0 && s.daysOverdue > 0);

  const byStudent = {};
  for (const p of monthPayments) {
    byStudent[p.studentId] = (byStudent[p.studentId] || 0) + (Number(p.amount) || 0);
  }
  // enrich payments with student course/batch for table
  const studentMap = Object.fromEntries(allStudents.map((s) => [s.id, s]));
  const enrichedPayments = monthPayments.map((p) => {
    const st = studentMap[p.studentId];
    return { ...p, studentCourse: st?.course || "", studentBatch: st?.batch || "", studentName: p.studentName || st?.name || "" };
  });

  return {
    label: monthLabel(date),
    monthKey: monthKey(date),
    totalStudents: enrolled.length,
    expected: expectedFromStudents,
    collected,
    pending: Math.max(0, expectedFromStudents - collected),
    collectionPercent: expectedFromStudents > 0 ? Math.round((collected / expectedFromStudents) * 100) : 0,
    paymentCount: monthPayments.length,
    overdueStudents: overdue.length,
    studentPayments: Object.keys(byStudent).length,
    payments: enrichedPayments
  };
}

export async function getMonthSeries(months = 6) {
  const store = await getStore();
  const payments = await store.model("Payment").find({}, { date: 1 });
  const series = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const total = payments
      .filter((p) => monthKey(p.date) === key)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    series.push({ key, label: monthLabel(d), total });
  }
  return series;
}

export async function getDailySeries(days = 7) {
  const store = await getStore();
  const payments = await store.model("Payment").find({}, { date: 1 });
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const total = payments
      .filter((p) => {
        const pd = toDate(p.date);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && pd.getDate() === d.getDate();
      })
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    series.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      total
    });
  }
  return series;
}

export async function getStudentGrowth(months = 6) {
  const store = await getStore();
  const students = await store.model("Student").find({}, { joiningDate: -1 });
  const series = [];
  const now = new Date();
  let cumulative = 0;
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const inMonth = students.filter((s) => monthKey(toDate(s.joiningDate)) === key).length;
    cumulative += inMonth;
    series.push({ key, label: monthLabel(d), students: cumulative });
  }
  return series;
}

export async function getBatchWiseCollection() {
  const store = await getStore();
  const [batches, students] = await Promise.all([
    store.model("Batch").find({}, null),
    store.model("Student").find({}, null)
  ]);
  const enriched = await Promise.all(students.map((s) => enrichStudent(s)));
  return batches.map((b) => {
    const members = enriched.filter((s) => s.batch === b.name);
    return {
      name: b.name,
      collected: members.reduce((s, m) => s + m.paid, 0),
      pending: members.reduce((s, m) => s + m.pending, 0),
      students: members.length
    };
  });
}