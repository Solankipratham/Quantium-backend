import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const useCacheFile = path.join(__dirname, "data", ".driver");

let driver = null;

function hasSupabase() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
  return url && key && !url.includes("your-project") && !String(key).includes("YOUR_") && String(key).length > 20;
}

export async function chooseDriver() {
  if (driver) return driver;
  if (hasSupabase()) {
    try {
      const { isSupabaseConfigured, getSupabaseInitError } = await import("../lib/supabase.js");
      if (isSupabaseConfigured()) {
        const initErr = getSupabaseInitError();
        if (initErr) {
          console.warn("[supabase] init error, falling back to fileStore:", initErr);
        } else {
          driver = "supabase";
          try { fs.writeFileSync(useCacheFile, "supabase"); } catch {}
          console.log("[quantum] using Supabase PostgreSQL");
          return driver;
        }
      }
    } catch (e) {
      console.warn("[supabase] init failed, falling back to fileStore:", e.message);
    }
  }
  driver = "file";
  try { fs.mkdirSync(path.dirname(useCacheFile), { recursive: true }); fs.writeFileSync(useCacheFile, "file"); } catch {}
  console.log("[quantum] using fileStore (Supabase not configured)");
  return driver;
}

export async function getStore() {
  const d = await chooseDriver();
  if (d === "supabase") {
    const mod = await import("./supabaseStore.js");
    return mod.default;
  }
  const mod = await import("./fileStore.js");
  return mod.default;
}

export function getDriver() {
  return driver || (hasSupabase() ? "supabase" : "file");
}

export function isMongo() { return false; }
export async function syncModelsToFileStore(state) {}
