import "dotenv/config";
import { chooseDriver, getStore } from "../data/store.js";

async function reset() {
  const driver = await chooseDriver();
  if (driver === "file") {
    const mod = await import("../data/fileStore.js");
    mod.loadState();
    for (const key of Object.keys(mod.loadState())) {
      if (key !== "_persisted") mod.loadState()[key] = [];
    }
    mod.persist();
    console.log("File store wiped. Run `npm run seed` to reseed.");
    process.exit(0);
  }
  if (driver === "supabase") {
    const store = await getStore();
    for (const m of ["Student", "Payment", "Batch", "Expense", "FeePlan", "AuditLog", "Notification"]) {
      try {
        const list = await store.model(m).find({}, null);
        for (const d of list) await store.model(m).deleteById(d.id).catch(()=>{});
      } catch {}
    }
    console.log("Supabase tables cleared (via API). Run `npm run seed` to reseed.");
    process.exit(0);
  }
  console.log(`Unknown driver ${driver} — nothing to reset`);
  process.exit(0);
}

reset().catch((e) => {
  console.error("[reset] failed:", e.message);
  process.exit(1);
});
