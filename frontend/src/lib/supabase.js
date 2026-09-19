import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
let isRealSupabase = false;

if (url && anon) {
  try {
    supabase = createClient(url, anon);
    isRealSupabase = true;
    console.log("[supabase] real client connected:", url);
  } catch (e) {
    console.warn("[supabase] client init failed:", e.message);
  }
} else {
  console.log("[supabase] no env vars — using API fallback");
}

// Always use the Express API fallback — auth and data go through the backend
supabase = null;
isRealSupabase = false;

// Fallback: proxy to Express API when Supabase JS client is not usable
function createFallbackClient() {
  const getToken = () => localStorage.getItem("quantum_token") || "";

  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://quantium-backend.onrender.com";
  const REQUEST_TIMEOUT = 15000;

  const api = async (path, opts = {}) => {
    const token = getToken();
    const headers = { ...opts.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (opts.body && typeof opts.body === "string") {
      headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        ...opts,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || `Request failed ${res.status}`);
      return data;
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === "AbortError") {
        throw new Error(
          "Request timed out. Please check your connection and try again."
        );
      }
      if (e.message === "Failed to fetch" || e.message === "NetworkError") {
        throw new Error(
          "Unable to connect to the server. Please check your internet connection."
        );
      }
      throw e;
    }
  };

  const endpointMap = {
    students: "/api/students",
    batches: "/api/batches",
    courses: "/api/courses",
    payments: "/api/payments",
    monthly_fees: "/api/fees/monthly",
    profiles: "/api/auth/me",
    audit_logs: "/api/audit-logs",
    notifications: "/api/notifications",
    fee_settings: "/api/settings",
  };

  function from(table) {
    const base = endpointMap[table] || `/api/${table}`;
    const state = { table, base, filters: {}, orderCol: null, orderAsc: true, limitN: null, isSingle: false };

    function build() {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(state.filters)) {
        params.append(k, typeof v === "object" ? JSON.stringify(v) : v);
      }
      const qs = params.toString();
      return qs ? `${state.base}?${qs}` : state.base;
    }

    function handleResult(d, single) {
      // Extract the correct array from the response
      const candidates = [d.students, d.plans, d.courses, d.batches, d.payments, d.logs, d.notifications, d.settings];
      let rows = candidates.find(Array.isArray);
      if (!rows) rows = Array.isArray(d) ? d : [];
      if (single) return { data: rows[0] || null, error: null };
      return { data: rows, error: null };
    }

    return {
      select() {
        return {
          eq(col, val) { state.filters[col] = val; return this; },
          neq(col, val) { state.filters[`neq:${col}`] = val; return this; },
          gte(col, val) { state.filters[`gte:${col}`] = val; return this; },
          lte(col, val) { state.filters[`lte:${col}`] = val; return this; },
          ilike(col, val) { state.filters[`ilike:${col}`] = val; return this; },
          in(col, vals) { state.filters[`in:${col}`] = vals; return this; },
          order(col, opts) { state.orderCol = col; state.orderAsc = opts?.ascending !== false; return this; },
          limit(n) { state.limitN = n; return this; },
          single() { state.isSingle = true; return this; },
          then(resolve, reject) {
            api(build()).then(d => resolve(handleResult(d, state.isSingle))).catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
          },
        };
      },

      insert(rows) {
        const arr = Array.isArray(rows) ? rows : [rows];
        return {
          select() {
            return {
              single() {
                return {
                  then(resolve, reject) {
                    api(state.base, { method: "POST", body: JSON.stringify(arr[0]) })
                      .then(d => resolve({ data: d.student || d.course || d.batch || d.payment || d, error: null }))
                      .catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
                  }
                };
              },
              then(resolve, reject) {
                api(state.base, { method: "POST", body: JSON.stringify(arr[0]) })
                  .then(d => resolve({ data: [d.student || d.course || d.batch || d.payment || d], error: null }))
                  .catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
              }
            };
          },
          then(resolve, reject) {
            Promise.all(arr.map(r => api(state.base, { method: "POST", body: JSON.stringify(r) })))
              .then(d => resolve({ data: d, error: null }))
              .catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
          }
        };
      },

      update(data) {
        return {
          eq(col, val) {
            return {
              select() {
                return {
                  single() {
                    return {
                      then(resolve, reject) {
                        api(`${state.base}/${val}`, { method: "PUT", body: JSON.stringify(data) })
                          .then(d => resolve({ data: d.student || d.course || d.batch || d, error: null }))
                          .catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
                      }
                    };
                  },
                  then(resolve, reject) {
                    api(`${state.base}/${val}`, { method: "PUT", body: JSON.stringify(data) })
                      .then(d => resolve({ data: [d.student || d.course || d.batch || d], error: null }))
                      .catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
                  }
                };
              },
              then(resolve, reject) {
                api(`${state.base}/${val}`, { method: "PUT", body: JSON.stringify(data) })
                  .then(d => resolve({ data: d.student || d.course || d.batch || d, error: null }))
                  .catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
              }
            };
          }
        };
      },

      delete() {
        return {
          eq(col, val) {
            return {
              then(resolve, reject) {
                api(`${state.base}/${val}`, { method: "DELETE" })
                  .then(d => resolve({ data: d, error: null }))
                  .catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
              }
            };
          }
        };
      },

      // Direct RPC-style call
      rpc(fn, params) {
        return {
          then(resolve, reject) {
            api(`/api/${fn}`, { method: "POST", body: JSON.stringify(params || {}) })
              .then(d => resolve({ data: d, error: null }))
              .catch(e => reject ? reject(e) : resolve({ data: null, error: e }));
          }
        };
      },

      channel() {
        return {
          on() { return this; },
          subscribe() { return { unsubscribe() {} }; },
        };
      },

      removeChannel() {},

      auth: {
        signInWithPassword: async ({ email, password }) => {
          try {
            const r = await api("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({ email, password })
            });
            localStorage.setItem("quantum_token", r.token);
            localStorage.setItem("quantum_user", JSON.stringify(r.user));
            return { data: { user: r.user, session: { access_token: r.token } }, error: null };
          } catch (e) { return { data: { user: null, session: null }, error: e }; }
        },
        signOut: async () => {
          try { await api("/api/auth/logout", { method: "POST" }); } catch {}
          localStorage.removeItem("quantum_token");
          localStorage.removeItem("quantum_user");
          return { error: null };
        },
        getUser: async () => {
          const token = getToken();
          if (!token) return { data: { user: null }, error: null };
          try {
            const r = await api("/api/auth/me");
            return { data: { user: r.user }, error: null };
          } catch {
            localStorage.removeItem("quantum_token");
            return { data: { user: null }, error: { message: "Not authenticated" } };
          }
        },
        getSession: async () => {
          const token = getToken();
          if (!token) return { data: { session: null }, error: null };
          return { data: { session: { access_token: token } }, error: null };
        },
        onAuthStateChange() {
          return { data: { subscription: { unsubscribe() {} } } };
        },
      },

      isFallback: true,
    };
  }

  return { from, auth: from("profiles").auth, isFallback: true };
}

const client = supabase || createFallbackClient();

export { supabase, isRealSupabase };
export default client;
