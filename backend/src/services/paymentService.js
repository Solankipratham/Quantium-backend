import { getStore } from "../data/store.js";
import { toDate, addMonths } from "./dates.js";
import { computeFeeProfile } from "./studentService.js";
import { getSettings, getNextReceiptNumber, buildReceiptNumber } from "./settingsService.js";
import { writeAuditLog, pushNotification } from "./activity.js";

export async function recordPayment({ studentId, amount, date, method, paymentFor, receiptNumber, notes, recordedBy, user, ip }) {
  const store = await getStore();
  const student = await store.model("Student").findById(studentId);
  if (!student) {
    const err = new Error("Student not found.");
    err.status = 404;
    throw err;
  }

  const settings = await getSettings(store);
  const payments = await store.model("Payment").find({ studentId });
  const paidSoFar = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const { finalFee, pending } = computeFeeProfile(student, paidSoFar);

  const amt = Number(amount);
  if (amt <= 0) {
    const err = new Error("Payment amount must be greater than zero.");
    err.status = 422;
    throw err;
  }
  if (amt > pending && !settings.fee.allowAdvancePayments) {
    const err = new Error(`Payment of ₹${amt.toLocaleString("en-IN")} exceeds the outstanding amount of ₹${pending.toLocaleString("en-IN")}.`);
    err.status = 422;
    throw err;
  }

  const nextCounter = await getNextReceiptNumber();
  const finalReceipt = receiptNumber || buildReceiptNumber(settings, nextCounter);

  const payment = await store.model("Payment").create({
    paymentId: `PY-${Date.now()}`,
    studentId,
    studentName: student.name,
    amount: amt,
    date: toDate(date),
    method,
    paymentFor: paymentFor || `${settings.fee.defaultPaymentCycle} Fee`,
    receiptNumber: finalReceipt,
    notes: notes || "",
    recordedBy: recordedBy || user?.id || ""
  });

  // Advance the student's next due date one cycle after a recorded payment.
  let nextDue = toDate(student.nextDueDate) || toDate(student.firstDueDate);
  if (nextDue && student.monthlyFee > 0) {
    const origDay = nextDue.getDate();
    nextDue = addMonths(nextDue, 1);
    if (nextDue.getDate() !== origDay) nextDue.setDate(Math.min(origDay, 28));
  }

  await store.model("Student").updateById(studentId, { nextDueDate: nextDue });

  await writeAuditLog({ user, action: `Recorded ${method} payment of ₹${amt.toLocaleString("en-IN")} for ${student.name}`, entity: "Payment", entityId: payment.id, details: { receipt: finalReceipt, studentId }, ip });
  await pushNotification({ type: "payment_received", title: "Payment received", message: `${finalReceipt} — ₹${amt.toLocaleString("en-IN")} received from ${student.name}.`, entity: "Payment", entityId: payment.id });

  const newPaid = paidSoFar + amt;
  const newPending = Math.max(0, finalFee - newPaid);

  return { payment, student: { ...student, paid: newPaid, pending: newPending } };
}

export async function editPayment(paymentId, patch, user, ip) {
  const store = await getStore();
  const payment = await store.model("Payment").findById(paymentId);
  if (!payment) {
    const err = new Error("Payment not found.");
    err.status = 404;
    throw err;
  }

  const student = await store.model("Student").findById(payment.studentId);
  const all = await store.model("Payment").find({ studentId: payment.studentId });
  const paidSoFar = all.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const { finalFee } = computeFeeProfile(student, paidSoFar);
  const pendingExcludingThis = Math.max(0, finalFee - (paidSoFar - (Number(payment.amount) || 0)));
  const settings = await getSettings(store);

  const newAmount = patch.amount !== undefined ? Number(patch.amount) : Number(payment.amount) || 0;
  if (newAmount > pendingExcludingThis && !settings.fee.allowAdvancePayments) {
    const err = new Error(`Payment of ₹${newAmount.toLocaleString("en-IN")} exceeds the outstanding amount of ₹${pendingExcludingThis.toLocaleString("en-IN")}.`);
    err.status = 422;
    throw err;
  }

  const merged = {
    ...(patch.amount !== undefined ? { amount: newAmount } : {}),
    ...(patch.date !== undefined ? { date: toDate(patch.date) } : {}),
    ...(patch.method !== undefined ? { method: patch.method } : {}),
    ...(patch.paymentFor !== undefined ? { paymentFor: patch.paymentFor } : {}),
    ...(patch.receiptNumber !== undefined ? { receiptNumber: patch.receiptNumber } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {})
  };

  const updated = await store.model("Payment").updateById(paymentId, merged);

  await writeAuditLog({
    user,
    action: `Edited payment for ${student.name} from ₹${(Number(payment.amount) || 0).toLocaleString("en-IN")} to ₹${newAmount.toLocaleString("en-IN")}`,
    entity: "Payment",
    entityId: paymentId,
    ip
  });
  await pushNotification({ type: "payment_edited", title: "Payment edited", message: `${student.name}'s payment was updated to ₹${newAmount.toLocaleString("en-IN")}.`, entity: "Payment", entityId: paymentId });

  return updated;
}

export async function deletePayment(paymentId, user, ip) {
  const store = await getStore();
  const payment = await store.model("Payment").findById(paymentId);
  if (!payment) {
    const err = new Error("Payment not found.");
    err.status = 404;
    throw err;
  }
  const student = await store.model("Student").findById(payment.studentId).catch(() => null);
  await store.model("Payment").deleteById(paymentId);

  await writeAuditLog({ user, action: `Deleted payment of ₹${(Number(payment.amount) || 0).toLocaleString("en-IN")}${student ? ` for ${student.name}` : ""}`, entity: "Payment", entityId: paymentId, ip });
  await pushNotification({ type: "payment_deleted", title: "Payment deleted", message: `A payment of ₹${(Number(payment.amount) || 0).toLocaleString("en-IN")}${student ? ` for ${student.name}` : ""} was removed.`, entity: "Payment", entityId: paymentId });
  return payment;
}