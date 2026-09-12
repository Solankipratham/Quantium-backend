import jwt from "jsonwebtoken";
import { getStore } from "../data/store.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@quantum.in";

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Verify local JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Check if this is the admin user
    if (payload.uid === "admin-001") {
      req.user = {
        id: "admin-001",
        name: process.env.ADMIN_NAME || "Admin",
        email: ADMIN_EMAIL,
        role: "admin"
      };
      req.userId = "admin-001";
      return next();
    }

    // Otherwise look up in the database
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
