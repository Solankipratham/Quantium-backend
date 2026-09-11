import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Input } from "../components/ui.jsx";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const submit = async (ev) => {
    ev.preventDefault();
    setError("");

    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    if (!password) { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg shadow-brand-500/25 mb-4">
            <span className="text-white font-extrabold text-xl tracking-wider" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>Q</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to the Fee Management System</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-elevated p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="admin@quantum.in"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

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
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error ? (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">
                <div className="w-5 h-5 rounded-full bg-danger-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-danger-600 text-xs font-bold">!</span>
                </div>
                <span className="break-words">{error}</span>
              </div>
            ) : null}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
              Forgot your password?
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Secured by Supabase Auth · Encrypted transmission
        </p>
      </div>
    </div>
  );
}
