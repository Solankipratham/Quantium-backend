import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import jwt from "jsonwebtoken";
import { getStore } from "../data/store.js";

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // If Supabase is configured, verify via Supabase Auth
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ message: "Invalid or expired session." });
      }
      // Load profile from profiles table
      const store = await getStore();
      const profile = await store.model("User").findById(user.id);
      req.user = profile || {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        email: user.email,
        role: user.user_metadata?.role || "admin"
      };
      req.userId = user.id;
      return next();
    }

    // Fallback: verify with local JWT (for fileStore mode)
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const store = await getStore();
    const user = await store.model("User").findById(payload.uid);
    if (!user || user.active === false) {
      return res.status(401).json({ message: "Session invalid or user disabled." });
    }
    req.user = user;
    req.userId = user.id;
    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    next(e);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action." });
    }
    next();
  };
}
