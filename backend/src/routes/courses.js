import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { sanitize } from "../middleware/validate.js";
import { writeAuditLog } from "../services/activity.js";

const router = Router();
router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const store = await getStore();
    const plans = await store.model("FeePlan").find({}, { course: 1 });
    // also include distinct courses from students for dynamic list
    const studentCourses = await store.model("Student").distinct("course");
    const merged = [...new Set([...plans.map((p) => p.course), ...studentCourses].filter(Boolean))];
    res.json({ courses: plans, courseNames: merged });
  } catch (e) { next(e); }
});

router.post("/", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    if (!body.name && !body.course) return res.status(422).json({ message: "Course name is required." });
    const store = await getStore();
    const plan = await store.model("FeePlan").create({
      course: body.course || body.name,
      monthlyFee: Number(body.monthlyFee) || 0,
      quarterlyFee: Number(body.quarterlyFee) || 0,
      halfYearlyFee: Number(body.halfYearlyFee) || 0,
      yearlyFee: Number(body.yearlyFee) || Number(body.courseFee) || 0,
      admissionFee: Number(body.admissionFee) || 0,
      description: body.description || ""
    });
    await writeAuditLog({ user: req.user, action: `Created course ${plan.course}`, entity: "Course", entityId: plan.id, ip: req.ip });
    res.status(201).json({ message: "Course created.", course: plan });
  } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const store = await getStore();
    const patch = {
      ...(body.course || body.name ? { course: body.course || body.name } : {}),
      ...(body.monthlyFee !== undefined ? { monthlyFee: Number(body.monthlyFee) || 0 } : {}),
      ...(body.yearlyFee !== undefined || body.courseFee !== undefined ? { yearlyFee: Number(body.yearlyFee ?? body.courseFee) || 0 } : {}),
      ...(body.description !== undefined ? { description: body.description } : {})
    };
    const plan = await store.model("FeePlan").updateById(req.params.id, patch);
    if (!plan) return res.status(404).json({ message: "Course not found." });
    res.json({ message: "Course updated.", course: plan });
  } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const store = await getStore();
    await store.model("FeePlan").deleteById(req.params.id);
    res.json({ message: "Course deleted." });
  } catch (e) { next(e); }
});

export default router;
