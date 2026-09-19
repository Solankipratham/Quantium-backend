import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { sanitize, validateStudent } from "../middleware/validate.js";
import { enrichStudent, listEnriched, finalFeeFromInput } from "../services/studentService.js";
import { writeAuditLog, pushNotification } from "../services/activity.js";

const router = Router();
router.use(authRequired);

// GET /api/students/deleted — recycle bin (must be before /:id)
router.get("/deleted", async (req, res, next) => {
  try {
    const store = await getStore();
    const raw = await store.model("Student").find({ is_deleted: true }, { deleted_at: -1 });
    let enriched = await Promise.all(raw.map((s) => enrichStudent(s)));
    const q = String(req.query.search || "").toLowerCase();
    if (q) enriched = enriched.filter((s) => [s.name, s.studentId, s.phone, s.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
    res.json({ students: enriched, total: enriched.length });
  } catch (e) { next(e); }
});

// POST /api/students/:id/restore
router.post("/:id/restore", async (req, res, next) => {
  try {
    const store = await getStore();
    const student = await store.model("Student").findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    if (!student.is_deleted) return res.status(400).json({ message: "Student is not in recycle bin." });
    const updated = await store.model("Student").updateById(req.params.id, { is_deleted: false, deleted_at: null, deleted_by: null });
    await writeAuditLog({ user: req.user, action: `Restored student ${updated.name} (${updated.studentId})`, entity: "Student", entityId: updated.id, ip: req.ip });
    res.json({ message: "Student restored.", student: updated });
  } catch (e) { next(e); }
});

// DELETE /api/students/:id/permanent — hard delete from recycle bin
router.delete("/:id/permanent", async (req, res, next) => {
  try {
    const store = await getStore();
    const student = await store.model("Student").findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    if (!student.is_deleted) return res.status(400).json({ message: "Move to recycle bin first." });
    await store.model("Payment").deleteMany({ studentId: student.id });
    await store.model("Student").deleteById(req.params.id);
    await writeAuditLog({ user: req.user, action: `Permanently deleted student ${student.name} (${student.studentId})`, entity: "Student", entityId: student.id, ip: req.ip });
    res.json({ message: "Student permanently deleted." });
  } catch (e) { next(e); }
});

// GET /api/students — list with search, filters, sorting (all enriched, active only)
router.get("/", async (req, res, next) => {
  try {
    const store = await getStore();
    const { search, batch, course, feeStatus, sort = "name" } = req.query;

    const raw = await store.model("Student").find({ is_deleted: { $ne: true } }, { name: 1 });
    let enriched = await Promise.all(raw.map((s) => enrichStudent(s)));

    if (search) {
      const q = String(search).toLowerCase();
      enriched = enriched.filter((s) =>
        [s.name, s.studentId, s.phone, s.parentName, s.parentPhone, s.email, s.course, s.batch]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (batch && batch !== "all") enriched = enriched.filter((s) => s.batch === batch);
    if (course && course !== "all") enriched = enriched.filter((s) => s.course === course);
    if (feeStatus && feeStatus !== "all") enriched = enriched.filter((s) => s.status === String(feeStatus).toUpperCase());

    switch (sort) {
      case "highestPending": enriched.sort((a, b) => b.pending - a.pending); break;
      case "lowestPending": enriched.sort((a, b) => a.pending - b.pending); break;
      case "recentPayment": enriched.sort((a, b) => (new Date(b.lastPayment?.date || 0)) - (new Date(a.lastPayment?.date || 0))); break;
      case "oldestDue": enriched.sort((a, b) => (new Date(a.nextDueDate || "9999")) - (new Date(b.nextDueDate || "9999"))); break;
      case "newest": enriched.sort((a, b) => (new Date(b.createdAt)) - (new Date(a.createdAt))); break;
      case "overdue": enriched.sort((a, b) => b.daysOverdue - a.daysOverdue); break;
      default: enriched.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json({ students: enriched, total: enriched.length });
  } catch (e) { next(e); }
});

// GET /api/students/filters — distinct values for filter dropdowns
router.get("/filters", async (req, res, next) => {
  try {
    const store = await getStore();
    const activeStudents = await store.model("Student").find({ is_deleted: { $ne: true } }, null);
    const batches = [...new Set(activeStudents.map(s => s.batch).filter(Boolean))];
    const courses = [...new Set(activeStudents.map(s => s.course).filter(Boolean))];
    const teachers = [...new Set(activeStudents.map(s => s.teacher).filter(Boolean))];
    res.json({ success: true, batches, courses, teachers });
  } catch (e) {
    console.error("GET /api/students/filters error:", e);
    next(e);
  }
});

// GET /api/students/:id
router.get("/:id", async (req, res, next) => {
  try {
    const store = await getStore();
    const student = await store.model("Student").findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    const enriched = await enrichStudent(student, { includePayments: true });
    const payments = await store.model("Payment").find({ studentId: student.id }, { date: -1 });
    res.json({ student: enriched, payments });
  } catch (e) { next(e); }
});

// POST /api/students
router.post("/", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const errors = validateStudent(body);
    if (errors.length) return res.status(422).json({ message: errors.join(" ") });
    const store = await getStore();

    let studentId = body.studentId;
    if (!studentId) {
      const year = new Date().getFullYear();
      const count = await store.model("Student").countDocuments({});
      const pad = String(count + 1).padStart(3, "0");
      studentId = `QTM-${year}-${pad}`;
      // make unique
      let exists = await store.model("Student").findOne({ studentId });
      let salt = 2;
      while (exists) {
        studentId = `QTM-${year}-${String(count + salt).padStart(3, "0")}`;
        exists = await store.model("Student").findOne({ studentId });
        salt++;
      }
    } else {
      const dupe = await store.model("Student").findOne({ studentId });
      if (dupe) return res.status(409).json({ message: "A student with this ID already exists." });
    }

    const finalFee = finalFeeFromInput(body);
    const student = await store.model("Student").create({
      studentId,
      name: body.name,
      dob: body.dob || null,
      gender: body.gender || "",
      phone: body.phone,
      parentName: body.parentName || "",
      parentPhone: body.parentPhone || "",
      email: body.email || "",
      address: body.address || "",
      course: body.course || "",
      subject: body.subject || "",
      batch: body.batch || "",
      teacher: body.teacher || "",
      joiningDate: body.joiningDate || new Date(),
      totalFee: Number(body.totalFee) || 0,
      monthlyFee: Number(body.monthlyFee) || 0,
      admissionFee: Number(body.admissionFee) || 0,
      discount: Number(body.discount) || 0,
      finalFee,
      paymentPlan: body.paymentPlan || "Monthly",
      firstDueDate: body.firstDueDate || null,
      monthlyDueDate: Number(body.monthlyDueDate) || 10,
      nextDueDate: body.firstDueDate || null,
      status: body.status || "Active",
      notes: body.notes || "",
      photo: body.photo || ""
    });

    await writeAuditLog({ user: req.user, action: `Added student ${student.name} (${studentId})`, entity: "Student", entityId: student.id, ip: req.ip });
    await pushNotification({ type: "student_added", title: "New student added", message: `${student.name} (${studentId}) was added to ${student.batch || "no batch"}.`, entity: "Student", entityId: student.id });

    res.status(201).json({ message: "Student successfully added.", student });
  } catch (e) { next(e); }
});

// PUT /api/students/:id
router.put("/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const errors = validateStudent(body);
    if (errors.length) return res.status(422).json({ message: errors.join(" ") });
    const store = await getStore();
    const existing = await store.model("Student").findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Student not found." });

    const patch = {
      name: body.name || existing.name,
      dob: body.dob || existing.dob,
      gender: body.gender ?? existing.gender,
      phone: body.phone || existing.phone,
      parentName: body.parentName ?? existing.parentName,
      parentPhone: body.parentPhone ?? existing.parentPhone,
      email: body.email ?? existing.email,
      address: body.address ?? existing.address,
      course: body.course ?? existing.course,
      subject: body.subject ?? existing.subject,
      batch: body.batch ?? existing.batch,
      teacher: body.teacher ?? existing.teacher,
      joiningDate: body.joiningDate || existing.joiningDate,
      totalFee: Number(body.totalFee) || existing.totalFee,
      monthlyFee: Number(body.monthlyFee) ?? existing.monthlyFee,
      admissionFee: Number(body.admissionFee) ?? existing.admissionFee,
      discount: Number(body.discount) ?? existing.discount,
      paymentPlan: body.paymentPlan || existing.paymentPlan,
      firstDueDate: body.firstDueDate ?? existing.firstDueDate,
      monthlyDueDate: Number(body.monthlyDueDate) || existing.monthlyDueDate,
      status: body.status || existing.status,
      notes: body.notes ?? existing.notes,
      photo: body.photo ?? existing.photo
    };
    patch.finalFee = finalFeeFromInput(body, { ...existing, ...patch });

    const updated = await store.model("Student").updateById(req.params.id, patch);
    await writeAuditLog({ user: req.user, action: `Updated profile for ${updated.name}`, entity: "Student", entityId: updated.id, ip: req.ip });
    res.json({ message: "Student profile updated.", student: await enrichStudent(updated) });
  } catch (e) { next(e); }
});

// DELETE /api/students/:id — soft delete (move to recycle bin)
router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const store = await getStore();
    const student = await store.model("Student").findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    if (student.is_deleted) return res.status(400).json({ message: "Already in recycle bin." });
    const patch = { is_deleted: true, deleted_at: new Date().toISOString() };
    const uid = req.userId || "";
    if (uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
      patch.deleted_by = uid;
    }
    await store.model("Student").updateById(req.params.id, patch);
    await writeAuditLog({ user: req.user, action: `Moved student to recycle bin: ${student.name} (${student.studentId})`, entity: "Student", entityId: student.id, ip: req.ip });
    await pushNotification({ type: "student_removed", title: "Student moved to recycle bin", message: `${student.name} was moved to recycle bin.`, entity: "Student", entityId: student.id });
    res.json({ message: "Student moved to recycle bin." });
  } catch (e) { next(e); }
});

export default router;
