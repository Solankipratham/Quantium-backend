import { Router } from "express";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { writeAuditLog } from "../services/activity.js";

const router = Router();

const tables = [
  "students",
  "batches",
  "courses",
  "payments",
  "monthly_fees",
  "audit_logs",
  "notifications",
  "fee_settings",
];

router.post("/reset", authRequired, authorize("ADMIN", "admin"), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({ message: "Reset only available with Supabase database." });
    }
    const supabase = getSupabase();
    const results = {};
    for (const table of tables) {
      const { error, count } = await supabase.from(table).delete().not("id", "is", null);
      if (error) {
        results[table] = { error: error.message };
      } else {
        results[table] = { deleted: count };
      }
    }
    await writeAuditLog({ user: req.user, action: "Reset all data", entity: "System", ip: req.ip });
    res.json({ success: true, message: "All data cleared.", results });
  } catch (e) { next(e); }
});

export default router;
