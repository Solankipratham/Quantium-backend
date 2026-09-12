import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getStore } from "../data/store.js";
import { sanitize, validateSignup } from "../middleware/validate.js";
import { authRequired } from "../middleware/auth.js";
import { writeAuditLog } from "../services/activity.js";

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@quantum.in";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "$2a$10$0A/6j/EqElG3RvwF015tVO/kgi0D/ldzb6I2bgZIFjDVElO8Jfthm";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

function signToken(user) {
  return jwt.sign(
    { uid: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function getAdminUser() {
  return {
    id: "admin-001",
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: "admin"
  };
}

// ── Login ──────────────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) return res.status(422).json({ message: "Email and password are required." });

    const loginEmail = String(email).toLowerCase().trim();

    if (loginEmail === ADMIN_EMAIL.toLowerCase()) {
      const ok = await bcrypt.compare(String(password), ADMIN_PASSWORD_HASH);
      if (!ok) return res.status(401).json({ message: "Invalid credentials." });
      const user = getAdminUser();
      const token = signToken(user);
      await writeAuditLog({ user, action: "Logged in", entity: "Auth", ip: req.ip });
      return res.json({ token, expiresIn: remember ? "7d" : "1d", user });
    }

    const store = await getStore();
    const user = await store.model("User").findOne({ email: loginEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });
    if (user.password) {
      const ok = await bcrypt.compare(String(password), user.password);
      if (!ok) return res.status(401).json({ message: "Invalid credentials." });
    }
    if (user.active === false) return res.status(403).json({ message: "Your account is disabled. Contact the administrator." });
    const token = signToken(user);
    await writeAuditLog({ user, action: "Logged in", entity: "Auth", ip: req.ip });
    res.json({ token, expiresIn: remember ? "7d" : "1d", user });
  } catch (e) { next(e); }
});

// ── Register (admin-only: blocked) ─────────────────────────────────────
router.post("/register", async (req, res) => {
  res.status(403).json({ message: "Registration is disabled. Only the admin account is allowed." });
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

    if (req.user?.email === ADMIN_EMAIL.toLowerCase()) {
      const ok = await bcrypt.compare(String(currentPassword), ADMIN_PASSWORD_HASH);
      if (!ok) return res.status(401).json({ message: "Current password is incorrect." });
      await writeAuditLog({ user: req.user, action: "Changed password", entity: "Auth", ip: req.ip });
      return res.json({ message: "Password updated. Note: Admin password changes require a server restart with the new ADMIN_PASSWORD_HASH env var." });
    }

    const store = await getStore();
    const user = await store.model("User").findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.password) {
      const ok = await bcrypt.compare(String(currentPassword), user.password);
      if (!ok) return res.status(401).json({ message: "Current password is incorrect." });
    }
    const hash = await bcrypt.hash(String(newPassword), 10);
    await store.model("User").updateById(req.userId, { password: hash });
    await writeAuditLog({ user: req.user, action: "Changed password", entity: "Auth", ip: req.ip });
    res.json({ message: "Password updated successfully." });
  } catch (e) { next(e); }
});

// ── Logout ─────────────────────────────────────────────────────────────
router.post("/logout", authRequired, async (req, res, next) => {
  try {
    await writeAuditLog({ user: req.user, action: "Logged out", entity: "Auth", ip: req.ip });
    res.json({ message: "Logged out." });
  } catch (e) { next(e); }
});

export default router;
