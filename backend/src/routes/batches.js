import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired } from "../middleware/auth.js";
import { sanitize } from "../middleware/validate.js";
import { enrichStudent, computeBatchesSummary } from "../services/studentService.js";
import { writeAuditLog } from "../services/activity.js";

const router = Router();
router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const store = await getStore();
    const batches = await store.model("Batch").find({}, null);
    const students = await store.model("Student").find({}, null);
    const enriched = await Promise.all(students.map((s) => enrichStudent(s)));
    res.json({ batches: computeBatchesSummary(batches, enriched) });
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const store = await getStore();
    const batch = await store.model("Batch").findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found." });
    const students = await store.model("Student").find({}, { name: 1 });
    const members = [];
    for (const s of students) {
      if (s.batch === batch.name) members.push(await enrichStudent(s));
    }
    const collected = members.reduce((sum, m) => sum + m.paid, 0);
    const pending = members.reduce((sum, m) => sum + m.pending, 0);
    res.json({
      batch: { ...batch, studentCount: members.length },
      students: members,
      collected,
      pending,
      capacity: Number(batch.capacity) || 0
    });
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    if (!body.name) return res.status(422).json({ message: "Batch name is required." });
    const store = await getStore();
    const batch = await store.model("Batch").create({
      name: body.name,
      course: body.course || "",
      teacher: body.teacher || "",
      days: Array.isArray(body.days) ? body.days : (body.days ? String(body.days).split(",").map((d) => d.trim()) : []),
      startTime: body.startTime || "",
      endTime: body.endTime || "",
      room: body.room || "",
      capacity: Number(body.capacity) || 0,
      active: body.active !== false
    });
    await writeAuditLog({ user: req.user, action: `Created batch ${batch.name}`, entity: "Batch", entityId: batch.id, ip: req.ip });
    res.status(201).json({ message: "Batch created.", batch });
  } catch (e) { next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const store = await getStore();
    const patch = Object.keys(body).length ? body : null;
    if (!patch) return res.status(422).json({ message: "No fields to update." });
    if (patch.days && typeof patch.days === "string") patch.days = patch.days.split(",").map((d) => d.trim());
    const batch = await store.model("Batch").updateById(req.params.id, patch);
    if (!batch) return res.status(404).json({ message: "Batch not found." });
    await writeAuditLog({ user: req.user, action: `Updated batch ${batch.name}`, entity: "Batch", entityId: batch.id, ip: req.ip });
    res.json({ message: "Batch updated.", batch });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const store = await getStore();
    const batch = await store.model("Batch").findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found." });
    await store.model("Batch").deleteById(req.params.id);
    await writeAuditLog({ user: req.user, action: `Deleted batch ${batch.name}`, entity: "Batch", entityId: batch.id, ip: req.ip });
    res.json({ message: "Batch deleted." });
  } catch (e) { next(e); }
});

export default router;