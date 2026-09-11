const BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("quantum_token") || "";
}

export async function api(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const h = { ...headers };
  if (body && !(body instanceof FormData)) {
    h["Content-Type"] = "application/json";
  }
  if (auth) {
    const t = getToken();
    if (t) h["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function formatINR(n) {
  const num = Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

export function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
