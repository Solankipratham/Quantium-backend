import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getStore } from "../data/store.js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { sanitize, validateSignup } from "../middleware/validate.js";
import { authRequired } from "../middleware/auth.js";
import { writeAuditLog } from "../services/activity.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { uid: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// ── Login ──────────────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) return res.status(422).json({ message: "Email and password are required." });

    // If Supabase is configured, use Supabase Auth
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return res.status(401).json({ message: error.message || "Invalid credentials." });
      }
      // Load profile
      const store = await getStore();
      const profile = await store.model("User").findById(data.user.id);
      const user = profile || {
        id: data.user.id,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
        email: data.user.email,
        role: data.user.user_metadata?.role || "admin"
      };
      await writeAuditLog({ user, action: "Logged in", entity: "Auth", ip: req.ip });
      return res.json({
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: remember ? "7d" : "1d",
        user
      });
    }

    // Fallback: local JWT auth (fileStore mode)
    const store = await getStore();
    const query = email ? { email: String(email).toLowerCase() } : {};
    const user = await store.model("User").findOne(query);
    if (!user) return res.status(401).json({ message: "Invalid credentials." });
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });
    if (user.active === false) return res.status(403).json({ message: "Your account is disabled. Contact the administrator." });
    const token = signToken(user);
    await writeAuditLog({ user, action: "Logged in", entity: "Auth", ip: req.ip });
    res.json({ token, expiresIn: remember ? "7d" : "1d", user });
  } catch (e) { next(e); }
});

// ── Register ───────────────────────────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const errors = validateSignup(body);
    if (errors.length) return res.status(422).json({ message: errors.join(" ") });

    // If Supabase is configured, use Supabase Auth
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: String(body.email).toLowerCase(),
        password: body.password,
        options: {
          data: {
            full_name: body.name,
            role: "admin"
          }
        }
      });
      if (error) {
        return res.status(400).json({ message: error.message || "Registration failed." });
      }
      if (data.user && !data.session) {
        return res.status(201).json({
          message: "Registration successful. Please check your email to verify your account.",
          user: { id: data.user.id, name: body.name, email: body.email, role: "admin" }
        });
      }
      const store = await getStore();
      const profile = await store.model("User").findById(data.user.id);
      const user = profile || { id: data.user.id, name: body.name, email: body.email, role: "admin" };
      return res.status(201).json({ token: data.session?.access_token, user });
    }

    // Fallback: local registration (fileStore mode)
    const store = await getStore();
    const existing = await store.model("User").findOne({ email: String(body.email).toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });
    const hash = await bcrypt.hash(String(body.password), 10);
    const user = await store.model("User").create({
      name: body.name,
      email: String(body.email).toLowerCase(),
      username: body.username || String(body.email).split("@")[0],
      password: hash,
      role: "ADMIN",
      phone: body.phone || ""
    });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (e) { next(e); }
});

// ── Get current user ──────────────────────────────────────────────────
router.get("/me", authRequired, async (req, res) => {
  res.json({ user: req.user });
});

// ── Change password ───────────────────────────────────────────────────
router.post("/change-password", authRequired, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword) return res.status(422).json({ message: "Current password is required." });
    if (!newPassword || newPassword.length < 6) return res.status(422).json({ message: "New password must be at least 6 characters." });

    // If Supabase is configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      // Use the admin client to update the user's password
      const { error } = await supabase.auth.admin.updateUserById(req.userId, { password: newPassword });
      if (error) {
        return res.status(400).json({ message: error.message || "Failed to update password." });
      }
      await writeAuditLog({ user: req.user, action: "Changed password", entity: "Auth", ip: req.ip });
      return res.json({ message: "Password updated successfully." });
    }

    // Fallback: local password change
    const store = await getStore();
    const user = await store.model("User").findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect." });
    const hash = await bcrypt.hash(String(newPassword), 10);
    await store.model("User").updateById(req.userId, { password: hash });
    await writeAuditLog({ user: req.user, action: "Changed password", entity: "Auth", ip: req.ip });
    res.json({ message: "Password updated successfully." });
  } catch (e) { next(e); }
});

// ── Logout ─────────────────────────────────────────────────────────────
router.post("/logout", authRequired, async (req, res, next) => {
  try {
    // Supabase: client handles signout by clearing token locally
    // No server-side action needed; JWT will expire naturally
    await writeAuditLog({ user: req.user, action: "Logged out", entity: "Auth", ip: req.ip });
    res.json({ message: "Logged out." });
  } catch (e) { next(e); }
});

export default router;
