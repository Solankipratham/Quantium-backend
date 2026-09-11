import { Router } from "express";
import { authRequired, authorize } from "../middleware/auth.js";
import { sanitize } from "../middleware/validate.js";
import { getSettings, saveSettings } from "../services/settingsService.js";
import { getStore } from "../data/store.js";
import { writeAuditLog } from "../services/activity.js";

const router = Router();
router.use(authRequired);

router.get("/", async (_req, res, next) => {
  try {
    res.json({ settings: await getSettings() });
  } catch (e) { next(e); }
});

router.put("/", authorize("ADMIN"), async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const settings = await saveSettings(body);
    await writeAuditLog({ user: req.user, action: "Updated application settings", entity: "Settings", ip: req.ip });
    res.json({ message: "Settings saved.", settings });
  } catch (e) { next(e); }
});

router.put("/receipt-counter", authorize("ADMIN"), async (req, res, next) => {
  try {
    const { value } = sanitize(req.body);
    const store = await getStore();
    await store.model("Setting").findOneAndUpdate({ key: "receiptCounter" }, { value: Number(value) || 0 }, { upsert: true });
    res.json({ message: "Receipt counter updated." });
  } catch (e) { next(e); }
});

export default router;