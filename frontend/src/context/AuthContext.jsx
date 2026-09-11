import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../lib/supabase.js";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("quantum_user") || "null"); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("quantum_token") || "");
  const [loading, setLoading] = useState(true);

  // On mount: check if we have a valid session
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setToken(session.access_token);
          localStorage.setItem("quantum_token", session.access_token);
          // Load user profile
          const { data: { user: supaUser } } = await supabase.auth.getUser();
          if (supaUser) {
            const u = {
              id: supaUser.id,
              name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || "",
              email: supaUser.email,
              role: supaUser.user_metadata?.role || "admin"
            };
            setUser(u);
            localStorage.setItem("quantum_user", JSON.stringify(u));
          }
        } else {
          // Try legacy token
          const legacyToken = localStorage.getItem("quantum_token");
          if (legacyToken) {
            const r = await api("/api/auth/me");
            setUser(r.user);
            localStorage.setItem("quantum_user", JSON.stringify(r.user));
          }
        }
      } catch {
        localStorage.removeItem("quantum_token");
        localStorage.removeItem("quantum_user");
        setToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Listen for Supabase auth state changes
  useEffect(() => {
    if (!supabase.isFallback) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.access_token) {
          setToken(session.access_token);
          localStorage.setItem("quantum_token", session.access_token);
          const { data: { user: supaUser } } = await supabase.auth.getUser();
          if (supaUser) {
            const u = {
              id: supaUser.id,
              name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || "",
              email: supaUser.email,
              role: supaUser.user_metadata?.role || "admin"
            };
            setUser(u);
            localStorage.setItem("quantum_user", JSON.stringify(u));
          }
        } else if (event === "SIGNED_OUT") {
          setToken("");
          setUser(null);
          localStorage.removeItem("quantum_token");
          localStorage.removeItem("quantum_user");
        }
      });
      return () => subscription?.unsubscribe?.();
    }
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const supaUser = data.user;
    const u = {
      id: supaUser.id,
      name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || "",
      email: supaUser.email,
      role: supaUser.user_metadata?.role || "admin"
    };
    const tok = data.session?.access_token || token;
    setToken(tok);
    setUser(u);
    localStorage.setItem("quantum_token", tok);
    localStorage.setItem("quantum_user", JSON.stringify(u));
    return { user: u, token: tok };
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setToken("");
    setUser(null);
    localStorage.removeItem("quantum_token");
    localStorage.removeItem("quantum_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
