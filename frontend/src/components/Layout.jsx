import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Layers, Wallet, Clock3, IndianRupee, BarChart3, Settings, Bell, LogOut, Menu, X, Building2, Receipt, FileBarChart, Trash2, ChevronRight, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { Avatar } from "./ui.jsx";

const NAV = [
  { section: "Main", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ] },
  { section: "Management", items: [
    { to: "/students", label: "Students", icon: Users },
    { to: "/batches", label: "Batches", icon: Layers },
    { to: "/fee-structure", label: "Courses", icon: Building2 },
  ] },
  { section: "Finance", items: [
    { to: "/fees/pending", label: "Pending Fees", icon: Clock3 },
    { to: "/payments", label: "Payments", icon: Receipt },
    { to: "/collections/daily", label: "Daily Collection", icon: Wallet },
    { to: "/collections/monthly", label: "Monthly Collection", icon: IndianRupee },
    { to: "/expenses", label: "Expenses", icon: IndianRupee },
  ] },
  { section: "System", items: [
    { to: "/reports", label: "Reports", icon: FileBarChart },
    { to: "/recycle-bin", label: "Recycle Bin", icon: Trash2 },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/settings", label: "Settings", icon: Settings },
  ] },
];

function SidebarContent({ onNavigate }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [recycleCount, setRecycleCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api("/api/students/deleted").then((r) => { if (!cancelled) setRecycleCount(r.total || 0); }).catch(() => {});
    const id = setInterval(() => {
      api("/api/students/deleted").then((r) => { if (!cancelled) setRecycleCount(r.total || 0); }).catch(() => {});
    }, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
          <span className="text-white font-extrabold text-sm tracking-wider">Q</span>
        </div>
        <div>
          <div className="text-[15px] font-bold text-white tracking-wider" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>QUANTUM</div>
          <div className="text-[10px] tracking-[0.2em] text-slate-400 uppercase">Coaching</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-3 px-3 space-y-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-500">{group.section}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.to === "/recycle-bin" && recycleCount > 0 ? (
                    <span className="bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{recycleCount}</span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <Avatar name={user?.name || "Admin"} size="sm" className="ring-2 ring-white/10" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.role || "admin"}</div>
          </div>
        </div>
        <button onClick={async () => { await logout(); navigate("/login"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Close drawer on navigation
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Breadcrumb from path
  const crumbs = location.pathname.split("/").filter(Boolean);
  const pageTitle = crumbs.length > 0 ? crumbs[crumbs.length - 1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[260px] z-30">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open ? (
          <motion.div className="lg:hidden fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] overflow-auto shadow-2xl" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-[260px] w-full min-w-0">
        {/* Navbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 w-full">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 w-full min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} className="lg:hidden w-10 h-10 shrink-0 grid place-items-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition">
                {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <span className="text-slate-900 font-semibold">{pageTitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline text-xs text-slate-400 whitespace-nowrap">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <Avatar name={user?.name || "Admin"} size="sm" />
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-slate-900 leading-tight">{user?.name || "Admin"}</div>
                  <div className="text-[11px] text-slate-400 capitalize">{user?.role || "admin"}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-5 md:p-6 lg:p-8 w-full max-w-[1400px] mx-auto min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
