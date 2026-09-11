import { getStore } from "../data/store.js";

export async function writeAuditLog({ user, action, entity = "", entityId = "", details = "", ip = "" }) {
  try {
    const store = await getStore();
    await store.model("AuditLog").create({
      userId: user?.id || "",
      userName: user?.name || "",
      action,
      entity,
      entityId,
      details: typeof details === "string" ? details : JSON.stringify(details),
      ip
    });
  } catch (e) {
    console.error("[audit] failed:", e.message);
  }
}

export async function pushNotification({ type, title, message, entity = "", entityId = "" }) {
  try {
    const store = await getStore();
    await store.model("Notification").create({ type, title, message, entity, entityId });
  } catch (e) {
    console.error("[notification] failed:", e.message);
  }
}