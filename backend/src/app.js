import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { getDriver } from "./data/store.js";

import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/students.js";
import paymentRoutes from "./routes/payments.js";
import batchRoutes from "./routes/batches.js";
import feeRoutes from "./routes/fees.js";
import courseRoutes from "./routes/courses.js";
import collectionRoutes from "./routes/collections.js";
import reportRoutes from "./routes/reports.js";
import expenseRoutes from "./routes/expenses.js";
import settingRoutes from "./routes/settings.js";
import auditRoutes from "./routes/auditLogs.js";
import notificationRoutes from "./routes/notifications.js";
import dashboardRoutes from "./routes/dashboard.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Length"],
  maxAge: 86400,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: "Too many login attempts. Try again later." } }));
app.use("/api/auth/register", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: "Too many registration attempts. Try again later." } }));
app.use("/api", limiter);

app.get("/api/health", (_req, res) => {
  try {
    const driver = getDriver();
    res.json({ success: true, message: "API is running", api: "ok", database: driver });
  } catch (e) {
    res.json({ success: true, message: "API is running", api: "ok", database: "unknown" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;