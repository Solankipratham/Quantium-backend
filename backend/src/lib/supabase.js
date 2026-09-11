import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

let supabaseAdmin = null;
let supabaseAnon = null;
let isConfigured = false;

if (url && (serviceKey || anonKey)) {
  try {
    if (serviceKey) {
      supabaseAdmin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    }
    if (anonKey) {
      supabaseAnon = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    }
    isConfigured = true;
    console.log("[supabase] connected to", url);
  } catch (e) {
    console.warn("[supabase] failed to init:", e.message);
  }
} else {
  console.log("[supabase] not configured — using fileStore fallback");
}

export function getSupabase() { return supabaseAdmin || supabaseAnon; }
export function getSupabaseAdmin() { return supabaseAdmin; }
export function getSupabaseAnon() { return supabaseAnon; }
export function isSupabaseConfigured() { return isConfigured; }
export default supabaseAdmin || supabaseAnon;
