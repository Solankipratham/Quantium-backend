import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { getDailyCollection, getMonthlySummary } from "../services/collectionsService.js";
import { toDate } from "../services/dates.js";

const router = Router();
router.use(authRequired);

router.get("/daily", async (req, res, next) => {
  try {
    const date = toDate(req.query.date) || new Date();
    res.json(await getDailyCollection(date));
  } catch (e) { next(e); }
});

router.get("/monthly", async (req, res, next) => {
  try {
    const date = toDate(req.query.date) || new Date();
    res.json(await getMonthlySummary(date));
  } catch (e) { next(e); }
});

export default router;