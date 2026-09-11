import { getStore } from "../data/store.js";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, toDate } from "./dates.js";
import { enrichStudent } from "./studentService.js";
import { getDailyCollection, getMonthSeries, getDailySeries, getStudentGrowth, getBatchWiseCollection, getMonthlySummary } from "./collectionsService.js";

export async function getDashboardData() {
  const store = await getStore();
  const now = new Date();

  const [students, payments] = await Promise.all([
    store.model("Student").find({ is_deleted: { $ne: true } }, null),
    store.model("Payment").find({}, { date: -1 })
  ]);

  const enriched = await Promise.all(students.map((s) => enrichStudent(s)));

  const totalPending = enriched.reduce((s, st) => s + st.pending, 0);
  const overdueStudents = enriched.filter((s) => s.pending > 0 && s.daysOverdue > 0);
  const paidStudents = enriched.filter((s) => s.status === "PAID");
  const partialStudents = enriched.filter((s) => s.status === "PARTIAL");

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const todayPayments = payments.filter((p) => toDate(p.date) >= todayStart && toDate(p.date) <= todayEnd);
  const monthPayments = payments.filter((p) => toDate(p.date) >= monthStart && toDate(p.date) <= monthEnd);

  const totalCollected = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const todayCollection = todayPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const monthCollection = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const todayPaymentCount = todayPayments.length;
  const monthPaymentCount = monthPayments.length;

  const todayMethods = {};
  for (const p of todayPayments) todayMethods[p.method] = (todayMethods[p.method] || 0) + Number(p.amount || 0);

  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dueSoonList = enriched.filter((s) => {
    const rec = (s.monthlyRecords || []).find((r) => r.monthKey === nowKey);
    return rec && (rec.status === "Due Soon" || rec.status === "Due Today");
  });
  const dueToday = enriched.filter((s) => {
    const rec = (s.monthlyRecords || []).find((r) => r.monthKey === nowKey);
    if (rec) return rec.status === "Due Today";
    const due = toDate(s.nextDueDate) || toDate(s.firstDueDate);
    if (!due) return false;
    return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
  });
  const dueThisWeek = dueSoonList;
  const dueSoonStudents = dueSoonList.length;

  const [monthSeries, dailySeries, growth, batchWise, monthlySummary] = await Promise.all([
    getMonthSeries(6),
    getDailySeries(7),
    getStudentGrowth(6),
    getBatchWiseCollection(),
    getMonthlySummary()
  ]);

  // overdue via monthly records as well
  const monthlyOverdue = enriched.filter((s) => {
    const rec = (s.monthlyRecords || []).find((r) => r.monthKey === nowKey);
    return rec && (rec.status === "Overdue" || (rec.status === "Partially Paid" && rec.daysRemaining < 0));
  });
  const finalOverdue = monthlyOverdue.length ? monthlyOverdue : overdueStudents;
  return {
    totalStudents: students.length,
    activeStudents: enriched.filter((s) => s.status !== "Inactive").length,
    paidStudents: paidStudents.length,
    partialStudents: partialStudents.length,
    pendingStudents: enriched.filter((s) => s.pending > 0).length,
    overdueStudents: finalOverdue.length,
    totalCollected,
    totalPending,
    todayCollection,
    todayPaymentCount,
    todayMethods,
    monthCollection,
    monthPaymentCount,
    recentPayments: todayPayments.slice(0, 8),
    overdueList: finalOverdue.slice(0, 6),
    dueToday: dueToday.length,
    dueThisWeek: dueThisWeek.length,
    dueSoonStudents: dueSoonStudents,
    dueSoonList: dueSoonList.slice(0, 6),
    dueTodayList: dueToday.slice(0, 6),
    charts: {
      monthSeries,
      dailySeries,
      growth,
      batchWise,
      paidVsPending: { paid: paidStudents.length, partial: partialStudents.length, pending: enriched.filter((s) => s.pending > 0).length }
    },
    monthlySummary
  };
}

export async function getDailyCollectionSummary(date) {
  return getDailyCollection(date);
}