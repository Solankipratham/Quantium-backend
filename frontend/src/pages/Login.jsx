
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Input } from "../components/ui.jsx";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@quantum.in");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const submit = async (ev) => {
    ev.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please confirm your email before signing in.");
      } else if (msg.includes("timed out")) {
        setError("Login is taking longer than expected. Please check your connection and try again.");
      } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Unable to connect")) {
        setError("Unable to connect to the server. Please check your internet connection.");
      } else if (msg.includes("429") || msg.includes("rate limit")) {
        setError("Too many login attempts. Please wait a moment and try again.");
      } else if (msg.includes("Access denied")) {
        setError("Access denied. Only the admin account is authorized.");
      } else {
        setError(msg || "Unable to sign in. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center px-4 py-8 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[520px] h-[520px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute -bottom-48 -left-48 w-[520px] h-[520px] rounded-full bg-purple-500/10 blur-[120px]" />

        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-400/5 blur-[140px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Main */}
      <div className="w-full max-w-[460px] relative z-10 animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-8">

          <div className="relative inline-flex mb-5">
            <div className="absolute inset-0 rounded-[20px] bg-brand-500/30 blur-xl" />

            {/* <div className="relative w-16 h-16 rounded-[20px] bg-gradient-to-br from-brand-500 via-brand-600 to-purple-600 shadow-2xl shadow-brand-500/30 flex items-center justify-center border border-white/20">
              <span
                className="text-white text-2xl font-black tracking-wider"
                style={{
                  fontFamily: "Space Grotesk, Inter, sans-serif",
                }}
              >
               
              </span>

              <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
             
              </div>
            </div> */}
          </div>

          <h1
            className="text-[28px] sm:text-[30px] font-bold text-slate-900 tracking-tight"
            style={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
            }}
          >
            Welcome back
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Sign in to continue managing your workspace
          </p>
        </div>

        {/* Card */}
        <div className="relative">

          {/* Card glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-blue-500/10 rounded-[30px] blur-xl" />

          <div className="relative bg-white/95 backdrop-blur-xl rounded-[28px] border border-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] p-6 sm:p-9">

            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Admin Portal
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Sign in to your account
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Enter your details to access the dashboard.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">

              {/* Email */}
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              {/* Password */}
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                  tabIndex={-1}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">
                      !
                    </span>
                  </div>

                  <span className="break-words leading-5">
                    {error}
                  </span>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full !rounded-xl !h-12 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
                loading={loading}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Continue"}
                {!loading && (
                  <ArrowRight className="w-4 h-4 ml-1" />
                )}
              </Button>
            </form>

            {/* Bottom message */}
            <div className="mt-7 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Your workspace is ready when you are.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 text-center">
          <p className="text-xs text-slate-400">
            Manage smarter. Stay organized. Move forward.
          </p>

          <p className="text-[11px] text-slate-300 mt-2">
            © {new Date().getFullYear()} Quantum. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

