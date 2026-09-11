import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

/* ─── Toast Context ──────────────────────────────────────────── */
const ToastCtx = createContext(null);
let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success", duration = 4000) => {
    const id = ++_toastId;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);
  const toast = {
    success: (m, d) => add(m, "success", d),
    error: (m, d) => add(m, "error", d),
    warning: (m, d) => add(m, "warning", d),
    info: (m, d) => add(m, "info", d),
  };
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60, scale: 0.95 }} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-elevated border text-sm font-medium ${t.type === "success" ? "bg-success-50 text-success-700 border-success-200" : t.type === "error" ? "bg-danger-50 text-danger-700 border-danger-200" : t.type === "warning" ? "bg-warning-50 text-warning-700 border-warning-200" : "bg-info-50 text-info-700 border-info-200"}`}>
            {t.type === "success" ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-success-500" /> : t.type === "error" ? <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-danger-500" /> : t.type === "warning" ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning-500" /> : <Info className="w-4 h-4 mt-0.5 shrink-0 text-info-500" />}
            <span className="break-words">{t.msg}</span>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { success() {}, error() {}, warning() {}, info() {} };
  return ctx;
}

/* ─── Card ───────────────────────────────────────────────────── */
export function Card({ className = "", hover = false, children, ...props }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-card ${hover ? "hover:shadow-card-hover transition-shadow duration-200" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}

/* ─── Button ─────────────────────────────────────────────────── */
export function Button({ variant = "primary", size = "md", className = "", loading = false, children, disabled, ...props }) {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 touch-manipulation whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97]";
  const sizes = { sm: "h-9 sm:h-8 px-3 text-xs gap-1.5", md: "h-11 sm:h-10 px-4 text-sm gap-2", lg: "h-12 sm:h-11 px-6 text-sm gap-2", xl: "h-13 sm:h-12 px-8 text-base gap-2.5" };
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md",
    success: "bg-success-600 text-white hover:bg-success-700 shadow-sm hover:shadow-md",
    danger: "bg-danger-600 text-white hover:bg-danger-700 shadow-sm hover:shadow-md",
    warning: "bg-warning-500 text-white hover:bg-warning-600 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    outline: "bg-white text-brand-600 border-2 border-brand-200 hover:bg-brand-50 hover:border-brand-300",
    "danger-outline": "bg-white text-danger-600 border-2 border-danger-200 hover:bg-danger-50",
  };
  return (
    <button className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  );
}

/* ─── Input ──────────────────────────────────────────────────── */
export function Input({ className = "", label, error, icon: Icon, ...props }) {
  return (
    <div className="w-full min-w-0">
      {label ? <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}{props.required ? <span className="text-danger-500 ml-0.5">*</span> : null}</label> : null}
      <div className="relative">
        {Icon ? <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /> : null}
        <input className={`w-full h-11 sm:h-10 ${Icon ? "pl-10" : "px-3"} pr-3 rounded-xl border ${error ? "border-danger-300 focus:ring-danger-500 focus:border-danger-500" : "border-slate-200 focus:ring-brand-500 focus:border-brand-500"} bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${className}`} {...props} />
      </div>
      {error ? <p className="mt-1 text-xs text-danger-600">{error}</p> : null}
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────────── */
export function Select({ className = "", label, error, children, ...props }) {
  return (
    <div className="w-full min-w-0">
      {label ? <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}{props.required ? <span className="text-danger-500 ml-0.5">*</span> : null}</label> : null}
      <select className={`w-full h-11 sm:h-10 px-3 rounded-xl border ${error ? "border-danger-300" : "border-slate-200 focus:ring-brand-500 focus:border-brand-500"} bg-white text-sm focus:outline-none focus:ring-2 transition-colors min-w-0 ${className}`} {...props}>{children}</select>
      {error ? <p className="mt-1 text-xs text-danger-600">{error}</p> : null}
    </div>
  );
}

/* ─── Textarea ───────────────────────────────────────────────── */
export function Textarea({ className = "", label, ...props }) {
  return (
    <div className="w-full min-w-0">
      {label ? <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label> : null}
      <textarea className={`w-full min-h-[88px] p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${className}`} {...props} />
    </div>
  );
}

/* ─── Label ──────────────────────────────────────────────────── */
export function Label({ className = "", ...props }) {
  return <label className={`text-xs font-semibold tracking-wide uppercase text-slate-500 ${className}`} {...props} />;
}

/* ─── Badge ──────────────────────────────────────────────────── */
export function Badge({ children, variant = "default", className = "", dot = false }) {
  const v = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-brand-50 text-brand-700 border-brand-200",
    success: "bg-success-50 text-success-700 border-success-200",
    warning: "bg-warning-50 text-warning-700 border-warning-200",
    danger: "bg-danger-50 text-danger-700 border-danger-200",
    info: "bg-info-50 text-info-700 border-info-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    muted: "bg-slate-50 text-slate-500 border-slate-200",
  };
  const dotColors = {
    default: "bg-slate-400", primary: "bg-brand-500", success: "bg-success-500", warning: "bg-warning-500", danger: "bg-danger-500", info: "bg-info-500", purple: "bg-purple-500", muted: "bg-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border ${v[variant] || v.default} ${className}`}>
      {dot ? <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} /> : null}
      {children}
    </span>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────── */
export function Avatar({ name = "", size = "md", className = "" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg", xl: "w-20 h-20 text-2xl" };
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-brand-100 text-brand-700", "bg-success-100 text-success-700", "bg-warning-100 text-warning-700", "bg-purple-100 text-purple-700", "bg-info-100 text-info-700", "bg-danger-100 text-danger-700"];
  const idx = (name || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length;
  return <div className={`${sizes[size] || sizes.md} rounded-full ${colors[idx]} flex items-center justify-center font-bold shrink-0 ${className}`}>{initials}</div>;
}

/* ─── EmptyState ─────────────────────────────────────────────── */
export function EmptyState({ title, description, action, icon: Icon }) {
  return (
    <div className="py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
        {Icon ? <Icon className="w-8 h-8 text-slate-400" /> : <div className="w-8 h-8 rounded-full bg-slate-200" />}
      </div>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      {description ? <div className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">{description}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* ─── LoadingState / Skeleton ────────────────────────────────── */
export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="py-12 flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-brand-600 animate-spin" />
      <div className="text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
}

export function Skeleton({ className = "", count = 1 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="w-16 h-4 rounded-lg bg-slate-200" />
      </div>
      <div className="w-24 h-8 rounded-lg bg-slate-200 mb-1" />
      <div className="w-32 h-3 rounded-lg bg-slate-100" />
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, description, children, width = "max-w-xl" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2, ease: "easeOut" }} className={`relative w-full ${width} max-w-[95vw] bg-white rounded-3xl shadow-modal max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col`}>
            {title ? (
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-5 sm:px-6 py-4 flex items-start justify-between shrink-0">
                <div>
                  <div className="text-base font-semibold text-slate-900">{title}</div>
                  {description ? <div className="text-sm text-slate-500 mt-0.5">{description}</div> : null}
                </div>
                <button onClick={onClose} aria-label="Close" className="w-9 h-9 shrink-0 grid place-items-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : null}
            <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 min-h-0">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* ─── PageHeader ─────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 w-full min-w-0">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

/* ─── StatCard ───────────────────────────────────────────────── */
export function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = "brand", className = "" }) {
  const gradients = {
    brand: "from-brand-500 to-brand-600",
    success: "from-success-500 to-success-600",
    warning: "from-warning-500 to-warning-600",
    danger: "from-danger-500 to-danger-600",
    info: "from-info-500 to-info-600",
    purple: "from-purple-500 to-purple-600",
  };
  const iconBg = {
    brand: "bg-brand-100 text-brand-600",
    success: "bg-success-100 text-success-600",
    warning: "bg-warning-100 text-warning-600",
    danger: "bg-danger-100 text-danger-600",
    info: "bg-info-100 text-info-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-card-hover transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[color] || iconBg.brand}`}>
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
        {trend !== undefined ? (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-600"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        ) : null}
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-sm font-medium text-slate-500 mt-0.5">{title}</div>
      {subtitle ? <div className="text-xs text-slate-400 mt-1">{subtitle}</div> : null}
    </div>
  );
}

/* ─── ProgressBar ────────────────────────────────────────────── */
export function ProgressBar({ value = 0, max = 100, color = "brand", className = "" }) {
  const pct = Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100));
  const colors = {
    brand: "bg-brand-500", success: "bg-success-500", warning: "bg-warning-500", danger: "bg-danger-500", info: "bg-info-500",
  };
  return (
    <div className={`w-full h-2 rounded-full bg-slate-100 overflow-hidden ${className}`}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className={`h-full rounded-full ${colors[color] || colors.brand}`} />
    </div>
  );
}

/* ─── Tabs ───────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div className={`flex gap-1 bg-slate-100 rounded-xl p-1 ${className}`}>
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          {t.label}
          {t.count !== undefined ? <span className={`ml-1.5 text-xs ${active === t.value ? "text-brand-600" : "text-slate-400"}`}>({t.count})</span> : null}
        </button>
      ))}
    </div>
  );
}
