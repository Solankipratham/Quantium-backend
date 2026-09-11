import { getStore } from "../data/store.js";
import { toDate, addMonths, daysBetween } from "./dates.js";

export function computeFeeProfile(student, paid) {
  const totalFee = Number(student.totalFee) || 0;
  const discount = Number(student.discount) || 0;
  const finalFee = student.finalFee !== undefined ? Number(student.finalFee) || 0 : totalFee - discount;
  const paidAmt = Number(paid) || 0;
  const pending = Math.max(0, finalFee - paidAmt);
  return { totalFee, discount, finalFee, paid: paidAmt, pending };
}

export function computeStatus(student, paid) {
  const { finalFee, paid: paidAmt, pending } = computeFeeProfile(student, paid);
  let status = "PAID";
  if (pending > 0) status = paidAmt > 0 ? "PARTIAL" : "PENDING";
  if (pending > 0 && isOverdue(student)) status = "OVERDUE";
  return status;
}

export function computeNextDueDate(student) {
  const today = new Date();
  let next = toDate(student.nextDueDate) || toDate(student.firstDueDate);
  if (!next) return null;
  // Keep the due date in the future if it has already passed.
  let guard = 0;
  while (next.getTime() < today.getTime() && guard < 60) {
    const dueDay = next.getDate();
    next = addMonths(next, 1);
    next.setDate(Math.min(dueDay, 28));
    guard++;
  }
  return next;
}

export function isOverdue(student) {
  const due = toDate(student.nextDueDate) || toDate(student.firstDueDate);
  if (!due) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const endOfDueDay = new Date(due);
  endOfDueDay.setHours(23, 59, 59, 999);
  return due.getTime() < today.getTime();
}

export function daysOverdue(student) {
  const due = toDate(student.nextDueDate) || toDate(student.firstDueDate);
  if (!due) return 0;
  const todaySod = new Date();
  todaySod.setHours(0, 0, 0, 0);
  const dueSod = new Date(due);
  dueSod.setHours(0, 0, 0, 0);
  const diff = Math.round((todaySod.getTime() - dueSod.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export async function enrichStudent(student, { includePayments = false } = {}) {
  const store = await getStore();
  const payments = await store.model("Payment").find({ studentId: student.id }, { date: -1 });
  const paid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const profile = computeFeeProfile(student, paid);
  const firstPayment = includePayments ? payments[0] || null : null;
  const status = computeStatus(student, paid);
  const nextDue = computeNextDueDate(student);
  // monthly fee engine
  let monthlyRecords = [];
  try {
    const { getMonthlyRecords } = await import("./monthlyFeeService.js");
    monthlyRecords = getMonthlyRecords(student, payments);
  } catch {}

  return {
    ...student,
    paid: profile.paid,
    pending: profile.pending,
    finalFee: profile.finalFee,
    status,
    nextDueDate: nextDue,
    firstDueDate: student.firstDueDate,
    daysOverdue: daysOverdue(student),
    monthlyRecords,
    lastPayment: firstPayment
      ? {
          amount: firstPayment.amount,
          date: firstPayment.date,
          receiptNumber: firstPayment.receiptNumber,
          method: firstPayment.method
        }
      : null
  };
}

export async function listEnriched(filter = {}, sort = null) {
  const store = await getStore();
  const students = await store.model("Student").find(filter, sort);
  const enriched = [];
  for (const s of students) {
    enriched.push(await enrichStudent(s));
  }
  return enriched;
}

export function finalFeeFromInput(b, existing = null) {
  const totalFee = Number(b.totalFee) || (existing ? existing.totalFee : 0) || 0;
  const discount = Number(b.discount ?? existing?.discount) || 0;
  const finalFee = Number(b.finalFee);
  if (!isNaN(finalFee) && b.finalFee !== undefined && b.finalFee !== null && b.finalFee !== "") {
    return finalFee;
  }
  return totalFee - discount;
}

export function computeBatchesSummary(batches, enrichedStudents) {
  return batches.map((batch) => {
    const members = enrichedStudents.filter((s) => s.batch === batch.name);
    return {
      ...batch,
      students: members.length,
      capacity: Number(batch.capacity) || 0,
      collected: members.reduce((s, m) => s + m.paid, 0),
      pending: members.reduce((s, m) => s + m.pending, 0)
    };
  });
}

export function isDueToday(student) {
  const due = toDate(student.nextDueDate) || toDate(student.firstDueDate);
  if (!due) return false;
  const today = new Date();
  return due.getFullYear() === today.getFullYear() && due.getMonth() === today.getMonth() && due.getDate() === today.getDate();
}

export function dueWithinDays(student, days) {
  const due = toDate(student.nextDueDate) || toDate(student.firstDueDate);
  if (!due) return false;
  const diff = daysBetween(new Date(), due);
  return diff >= 0 && diff <= days;
}