import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authRequired, authorize("ADMIN"));

router.get("/", async (req, res, next) => {
  try {
    const store = await getStore();
    const limit = Number(req.query.limit) || 100;
    const logs = await store.model("AuditLog").find({}, { createdAt: -1 });
    res.json({ logs: logs.slice(0, limit), total: logs.length });
  } catch (e) { next(e); }
});

export default router;