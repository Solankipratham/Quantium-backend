import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { studentReport, feeReport, collectionReport, batchReport, paymentMethodReport } from "../services/reportsService.js";
import { toDate } from "../services/dates.js";

const router = Router();
router.use(authRequired, authorize("ADMIN"));

router.get("/students", async (_req, res, next) => {
  try { res.json(await studentReport()); } catch (e) { next(e); }
});

router.get("/fees", async (_req, res, next) => {
  try { res.json(await feeReport()); } catch (e) { next(e); }
});

router.get("/collections", async (req, res, next) => {
  try {
    const period = req.query.period || "monthly";
    res.json(await collectionReport(period));
  } catch (e) { next(e); }
});

router.get("/batches", async (_req, res, next) => {
  try { res.json(await batchReport()); } catch (e) { next(e); }
});

router.get("/payment-methods", async (req, res, next) => {
  try {
    const from = toDate(req.query.from) || null;
    const to = toDate(req.query.to) || null;
    res.json(await paymentMethodReport(from, to));
  } catch (e) { next(e); }
});

// Combined payload for the reports page
router.get("/all", async (_req, res, next) => {
  try {
    const [students, fees, collections, batches, methods, expenses] = await Promise.all([
      studentReport(),
      feeReport(),
      collectionReport("monthly"),
      batchReport(),
      paymentMethodReport(),
      (async () => {
        const store = await getStore();
        const list = await store.model("Expense").find({}, { date: 1 });
        const total = list.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        return { total, count: list.length };
      })()
    ]);
    res.json({ students, fees, collections, batches, methods, expenses });
  } catch (e) { next(e); }
});

export default router;