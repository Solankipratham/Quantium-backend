import { Router } from "express";
import { authRequired, authorize } from "../middleware/auth.js";
import { getDashboardData } from "../services/dashboardService.js";

const router = Router();
router.use(authRequired, authorize("ADMIN"));

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getDashboardData());
  } catch (e) { next(e); }
});

export default router;