import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { sanitize } from "../middleware/validate.js";
import { listEnriched } from "../services/studentService.js";
import { writeAuditLog } from "../services/activity.js";

const router = Router();
router.use(authRequired);

// Fee plans CRUD
router.get("/plans", async (req, res, next) => {
  try {
    const store = await getStore();
    const plans = await store.model("FeePlan").find({}, { course: 1 });
    res.json({ plans });
  } catch (e) { next(e); }
});

router.post("/plans", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    if (!body.course) return res.status(422).json({ message: "Course is required." });
    const store = await getStore();
    const plan = await store.model("FeePlan").create({
      course: body.course,
      monthlyFee: Number(body.monthlyFee) || 0,
      quarterlyFee: Number(body.quarterlyFee) || 0,
      halfYearlyFee: Number(body.halfYearlyFee) || 0,
      yearlyFee: Number(body.yearlyFee) || 0,
      admissionFee: Number(body.admissionFee) || 0,
      description: body.description || ""
    });
    await writeAuditLog({ user: req.user, action: `Created fee plan for ${plan.course}`, entity: "FeePlan", entityId: plan.id, ip: req.ip });
    res.status(201).json({ message: "Fee plan created.", plan });
  } catch (e) { next(e); }
});

router.put("/plans/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const store = await getStore();
    const patch = {
      ...(body.course ? { course: body.course } : {}),
      ...(body.monthlyFee !== undefined ? { monthlyFee: Number(body.monthlyFee) || 0 } : {}),
      ...(body.quarterlyFee !== undefined ? { quarterlyFee: Number(body.quarterlyFee) || 0 } : {}),
      ...(body.halfYearlyFee !== undefined ? { halfYearlyFee: Number(body.halfYearlyFee) || 0 } : {}),
      ...(body.yearlyFee !== undefined ? { yearlyFee: Number(body.yearlyFee) || 0 } : {}),
      ...(body.admissionFee !== undefined ? { admissionFee: Number(body.admissionFee) || 0 } : {}),
      ...(body.description !== undefined ? { description: body.description } : {})
    };
    const plan = await store.model("FeePlan").updateById(req.params.id, patch);
    if (!plan) return res.status(404).json({ message: "Fee plan not found." });
    res.json({ message: "Fee plan updated.", plan });
  } catch (e) { next(e); }
});

router.delete("/plans/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const store = await getStore();
    await store.model("FeePlan").deleteById(req.params.id);
    res.json({ message: "Fee plan deleted." });
  } catch (e) { next(e); }
});

// GET /api/fees/pending — the most important page (5-day warning + monthly logic)
router.get("/pending", async (req, res, next) => {
  try {
    const enriched = await listEnriched({}, null);
    // enrich with monthly due-soon logic
    const nowKey = new Date().toISOString().slice(0, 7);
    const pendingStudents = enriched.filter((s) => {
      if (s.pending <= 0) return false;
      const rec = (s.monthlyRecords || []).find((r) => r.monthKey === nowKey);
      if (!rec) return s.pending > 0;
      // Only show if not Upcoming (i.e., within 5-day window or overdue)
      return rec.status !== "Upcoming";
    });
    pendingStudents.sort((a, b) => b.pending - a.pending);
    const totalPending = pendingStudents.reduce((s, st) => s + st.pending, 0);
    const overdue = pendingStudents.filter((s) => {
      const rec = (s.monthlyRecords || []).find((r) => r.monthKey === nowKey);
      return rec ? rec.status === "Overdue" || rec.status === "Partially Paid" : s.daysOverdue > 0;
    });
    const dueSoon = pendingStudents.filter((s) => {
      const rec = (s.monthlyRecords || []).find((r) => r.monthKey === nowKey);
      return rec && (rec.status === "Due Soon" || rec.status === "Due Today");
    });
    res.json({
      summary: {
        totalPending,
        studentsPending: pendingStudents.length,
        overdue: overdue.length,
        dueSoon: dueSoon.length
      },
      students: pendingStudents.map((s) => {
        const rec = (s.monthlyRecords || []).find((r) => r.monthKey === nowKey);
        return { ...s, currentMonth: rec || null };
      })
    });
  } catch (e) { next(e); }
});

// GET /api/fees — summary for all students (alias for overview)
router.get("/", async (req, res, next) => {
  try {
    const enriched = await listEnriched({}, null);
    res.json({
      total: enriched.length,
      paid: enriched.filter((s) => s.status === "PAID").length,
      partial: enriched.filter((s) => s.status === "PARTIAL").length,
      pending: enriched.filter((s) => s.status === "PENDING").length,
      overdue: enriched.filter((s) => s.status === "OVERDUE").length,
      totalPending: enriched.reduce((s, st) => s + st.pending, 0),
      totalCollected: enriched.reduce((s, st) => s + st.paid, 0),
      students: enriched
    });
  } catch (e) { next(e); }
});

// GET /api/fees/monthly — monthly collection alias
router.get("/monthly", async (req, res, next) => {
  try {
    const { getMonthlySummary } = await import("../services/collectionsService.js");
    const { toDate } = await import("../services/dates.js");
    const month = req.query.month || req.query.date;
    const date = toDate(month) || new Date();
    res.json(await getMonthlySummary(date));
  } catch (e) { next(e); }
});

// GET /api/fees/student/:studentId — per-student fee records
router.get("/student/:studentId", async (req, res, next) => {
  try {
    const store = await getStore();
    const student = await store.model("Student").findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found." });
    const payments = await store.model("Payment").find({ studentId: student.id }, { date: -1 });
    const { getMonthlyRecords } = await import("../services/monthlyFeeService.js");
    const records = getMonthlyRecords(student, payments);
    res.json({ student, payments, monthlyRecords: records });
  } catch (e) { next(e); }
});

// GET /api/fees/overview — statuses distribution
router.get("/overview", async (req, res, next) => {
  try {
    const enriched = await listEnriched({}, null);
    res.json({
      paid: enriched.filter((s) => s.status === "PAID").length,
      partial: enriched.filter((s) => s.status === "PARTIAL").length,
      pending: enriched.filter((s) => s.status === "PENDING").length,
      overdue: enriched.filter((s) => s.status === "OVERDUE").length,
      totalPending: enriched.reduce((s, st) => s + st.pending, 0)
    });
  } catch (e) { next(e); }
});

export default router;