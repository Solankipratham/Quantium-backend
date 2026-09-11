import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { sanitize } from "../middleware/validate.js";
import { toDate, startOfMonth, endOfMonth } from "../services/dates.js";
import { writeAuditLog } from "../services/activity.js";

const router = Router();
router.use(authRequired);

const CATEGORIES = ["Rent", "Electricity", "Teacher Salary", "Marketing", "Stationery", "Internet", "Maintenance", "Other"];

router.get("/", async (req, res, next) => {
  try {
    const store = await getStore();
    let filter = {};
    if (req.query.category && req.query.category !== "all") filter.category = req.query.category;
    if (req.query.month) {
      const d = new Date(req.query.month);
      if (!isNaN(d.getTime())) {
        filter.date = { $gte: startOfMonth(d), $lte: endOfMonth(d) };
      }
    }
    const expenses = await store.model("Expense").find(filter, { date: -1 });
    const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const byCategory = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.amount) || 0);
    }
    const all = await store.model("Expense").find({}, null);
    const totalAll = all.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    res.json({ expenses, total, totalAll, byCategory });
  } catch (e) { next(e); }
});

router.post("/", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const amount = Number(body.amount);
    if (!body.category || !CATEGORIES.includes(body.category)) return res.status(422).json({ message: "A valid expense category is required." });
    if (!amount || amount <= 0) return res.status(422).json({ message: "Amount must be greater than zero." });
    if (!body.date || isNaN(new Date(body.date).getTime())) return res.status(422).json({ message: "A valid expense date is required." });
    const store = await getStore();
    const expense = await store.model("Expense").create({
      category: body.category,
      description: body.description || "",
      amount,
      date: toDate(body.date),
      method: body.method || "Cash",
      notes: body.notes || ""
    });
    await writeAuditLog({ user: req.user, action: `Added expense: ${expense.category} ₹${amount.toLocaleString("en-IN")}`, entity: "Expense", entityId: expense.id, ip: req.ip });
    res.status(201).json({ message: "Expense added.", expense });
  } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const store = await getStore();
    const patch = {
      ...(body.category ? { category: body.category } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
      ...(body.date ? { date: toDate(body.date) } : {}),
      ...(body.method ? { method: body.method } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {})
    };
    const expense = await store.model("Expense").updateById(req.params.id, patch);
    if (!expense) return res.status(404).json({ message: "Expense not found." });
    res.json({ message: "Expense updated.", expense });
  } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try {
    const store = await getStore();
    const expense = await store.model("Expense").findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found." });
    await store.model("Expense").deleteById(req.params.id);
    await writeAuditLog({ user: req.user, action: `Deleted expense: ${expense.category} ₹${(Number(expense.amount) || 0).toLocaleString("en-IN")}`, entity: "Expense", entityId: expense.id, ip: req.ip });
    res.json({ message: "Expense deleted." });
  } catch (e) { next(e); }
});

export default router;