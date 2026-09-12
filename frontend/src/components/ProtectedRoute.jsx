import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { token, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-brand-600 animate-spin" />
          <div className="text-sm text-slate-500 font-medium">Loading...</div>
        </div>
      </div>
    );
  }
  if (!token) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-50 grid place-items-center p-8 text-center">
      <div>
        <div className="text-lg font-bold text-slate-900">Access Denied</div>
        <p className="text-sm text-slate-500 mt-2">Only the admin account is authorized to access this panel.</p>
        <a href="/admin/login" className="text-sm text-brand-600 hover:underline mt-4 inline-block">Go to login</a>
      </div>
    </div>
  );
  return children;
}
