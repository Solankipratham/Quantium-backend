import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Construction, ArrowLeft, LayoutDashboard } from "lucide-react";

function humanize(path) {
  if (!path) return "";
  return path
    .replace(/^\//, "")
    .replace(/[-_/]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UnderDevelopment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const feature = params.get("feature") || humanize(location.pathname);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 mb-6">
          <Construction className="w-10 h-10 text-amber-500" />
        </div>

        {feature ? (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
              {feature}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              This page is currently under development.<br />We're working on this feature and it will be available soon.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
              This Page Is Under Development
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              We're currently working on this feature.<br />It will be available soon.
            </p>
          </>
        )}

        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/25 active:scale-95 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
