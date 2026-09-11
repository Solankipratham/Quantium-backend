import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { sanitize, validatePayment } from "../middleware/validate.js";
import { recordPayment, editPayment, deletePayment } from "../services/paymentService.js";
import { toDate } from "../services/dates.js";

const router = Router();
router.use(authRequired);

// GET /api/payments — ledger with filters
router.get("/", async (req, res, next) => {
  try {
    const store = await getStore();
    const { studentId, from, to, method } = req.query;
    let filter = {};
    if (studentId) filter.studentId = studentId;
    if (from) filter.date = { $gte: toDate(from) };
    if (to) filter.date = { ...(filter.date || {}), $lte: toDate(to) };
    if (method && method !== "all") filter.method = method;
    const payments = await store.model("Payment").find(filter, { date: -1 });
    res.json({ payments, total: payments.reduce((s, p) => s + (Number(p.amount) || 0), 0) });
  } catch (e) { next(e); }
});

// POST /api/payments
router.post("/", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const store = await getStore();
    const student = await store.model("Student").findById(body.studentId);
    if (!student) return res.status(404).json({ message: "Student not found." });
    const errors = validatePayment(body, student);
    if (errors.length) return res.status(422).json({ message: errors.join(" ") });
    const result = await recordPayment({ ...body, user: req.user, ip: req.ip });
    res.status(201).json({ message: "Payment recorded.", ...result });
  } catch (e) { next(e); }
});

// PUT /api/payments/:id
router.put("/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const updated = await editPayment(req.params.id, body, req.user, req.ip);
    res.json({ message: "Payment updated.", payment: updated });
  } catch (e) { next(e); }
});

// DELETE /api/payments/:id
router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const deleted = await deletePayment(req.params.id, req.user, req.ip);
    res.json({ message: "Payment deleted.", payment: deleted });
  } catch (e) { next(e); }
});

// GET /api/payments/:id — receipt payload
router.get("/:id", async (req, res, next) => {
  try {
    const store = await getStore();
    const payment = await store.model("Payment").findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found." });
    const student = await store.model("Student").findById(payment.studentId).catch(() => null);
    const allPrev = await store.model("Payment").find({ studentId: payment.studentId }, { date: -1 });
    const paidBeforeThis = allPrev
      .filter((p) => p.id !== payment.id && new Date(p.date) <= new Date(payment.date))
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const settings = await import("../services/settingsService.js").then((m) => m.getSettings(store));
    res.json({
      payment,
      student: student ? { name: student.name, studentId: student.studentId, batch: student.batch } : null,
      previousPaid: paidBeforeThis,
      pending: student ? Math.max(0, (Number(student.finalFee) || 0) - paidBeforeThis) : 0,
      coaching: settings.coaching,
      afterPayment: student
        ? { paid: paidBeforeThis + Number(payment.amount || 0), pending: Math.max(0, (Number(student.finalFee) || 0) - paidBeforeThis - Number(payment.amount || 0)) }
        : null
    });
  } catch (e) { next(e); }
});

export default router;