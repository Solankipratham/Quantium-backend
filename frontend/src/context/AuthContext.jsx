import { createContext, useContext, useEffect, useState, useCallback } from "react";
import supabase from "../lib/supabase.js";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

const ADMIN_EMAIL = "admin@quantum.in";

function readCachedAuth() {
  try {
    const token = localStorage.getItem("quantum_token") || "";
    const userRaw = localStorage.getItem("quantum_user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { token, user };
  } catch {
    return { token: "", user: null };
  }
}

function clearAuthState(setUser, setToken) {
  setToken("");
  setUser(null);
  localStorage.removeItem("quantum_token");
  localStorage.removeItem("quantum_user");
}

export function AuthProvider({ children }) {
  const cached = readCachedAuth();

  const [user, setUser] = useState(cached.user);
  const [token, setToken] = useState(cached.token);

  const hasCachedAuth = !!(cached.token && cached.user);
  const [loading, setLoading] = useState(!hasCachedAuth);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.access_token) {
          const { data: { user: supaUser } } = await supabase.auth.getUser();

          if (cancelled) return;

          if (supaUser) {
            if (supaUser.email !== ADMIN_EMAIL) {
              await supabase.auth.signOut();
              clearAuthState(setUser, setToken);
              return;
            }

            const u = {
              id: supaUser.id,
              name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || "Admin",
              email: supaUser.email,
              role: "admin",
            };
            setUser(u);
            setToken(session.access_token);
            localStorage.setItem("quantum_token", session.access_token);
            localStorage.setItem("quantum_user", JSON.stringify(u));
          } else {
            clearAuthState(setUser, setToken);
          }
        } else {
          const legacyToken = localStorage.getItem("quantum_token");
          if (legacyToken) {
            try {
              const r = await api("/api/auth/me");

              if (cancelled) return;

              if (r.user?.email !== ADMIN_EMAIL) {
                clearAuthState(setUser, setToken);
                return;
              }
              setUser(r.user);
              setToken(legacyToken);
              localStorage.setItem("quantum_user", JSON.stringify(r.user));
            } catch {
              if (cancelled) return;
              clearAuthState(setUser, setToken);
            }
          } else {
            clearAuthState(setUser, setToken);
          }
        }
      } catch {
        if (!cancelled) {
          clearAuthState(setUser, setToken);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!supabase.isFallback) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.access_token) {
          setToken(session.access_token);
          localStorage.setItem("quantum_token", session.access_token);
          const { data: { user: supaUser } } = await supabase.auth.getUser();
          if (supaUser) {
            if (supaUser.email !== ADMIN_EMAIL) {
              await supabase.auth.signOut();
              clearAuthState(setUser, setToken);
              return;
            }
            const u = {
              id: supaUser.id,
              name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || "Admin",
              email: supaUser.email,
              role: "admin",
            };
            setUser(u);
            localStorage.setItem("quantum_user", JSON.stringify(u));
          }
        } else if (event === "SIGNED_OUT") {
          clearAuthState(setUser, setToken);
        }
      });
      return () => subscription?.unsubscribe?.();
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const supaUser = data.user;
    if (supaUser.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      throw new Error("Access denied. Only the admin account is authorized.");
    }

    const u = {
      id: supaUser.id,
      name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || "Admin",
      email: supaUser.email,
      role: "admin",
    };
    const tok = data.session?.access_token || "";

    setUser(u);
    setToken(tok);
    localStorage.setItem("quantum_token", tok);
    localStorage.setItem("quantum_user", JSON.stringify(u));

    return { user: u, token: tok };
  }, []);

  const logout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch {}
    clearAuthState(setUser, setToken);
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
