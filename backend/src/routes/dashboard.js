import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { getDashboardData } from "../services/dashboardService.js";

const router = Router();
router.use(authRequired);

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getDashboardData());
  } catch (e) { next(e); }
});

export default router;