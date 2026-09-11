import { Router } from "express";
import { getStore } from "../data/store.js";
import { authRequired, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authRequired, authorize("ADMIN"));

router.get("/", async (req, res, next) => {
  try {
    const store = await getStore();
    const limit = Number(req.query.limit) || 50;
    const notifications = await store.model("Notification").find({}, { createdAt: -1 });
    const unread = notifications.filter((n) => !n.read).length;
    res.json({ notifications: notifications.slice(0, limit), unread, total: notifications.length });
  } catch (e) { next(e); }
});

router.put("/read-all", async (_req, res, next) => {
  try {
    const store = await getStore();
    const list = await store.model("Notification").find({ read: false }, null);
    for (const n of list) await store.model("Notification").updateById(n.id, { read: true });
    res.json({ message: "All notifications marked as read." });
  } catch (e) { next(e); }
});

router.put("/:id/read", async (req, res, next) => {
  try {
    const store = await getStore();
    await store.model("Notification").updateById(req.params.id, { read: true });
    res.json({ message: "Marked as read." });
  } catch (e) { next(e); }
});

router.delete("/", async (_req, res, next) => {
  try {
    const store = await getStore();
    await store.model("Notification").deleteMany({});
    res.json({ message: "Notifications cleared." });
  } catch (e) { next(e); }
});

export default router;