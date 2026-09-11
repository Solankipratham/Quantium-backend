import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
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
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
