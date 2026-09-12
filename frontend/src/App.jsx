import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/ui.jsx";
import { Layout } from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Students from "./pages/Students.jsx";
import AddStudent from "./pages/AddStudent.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import Batches from "./pages/Batches.jsx";
import BatchDetail from "./pages/BatchDetail.jsx";
import PendingFees from "./pages/PendingFees.jsx";
import FeeStructure from "./pages/FeeStructure.jsx";
import CollectionsDaily from "./pages/CollectionsDaily.jsx";
import CollectionsMonthly from "./pages/CollectionsMonthly.jsx";
import Payments from "./pages/Payments.jsx";
import Expenses from "./pages/Expenses.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import RecycleBin from "./pages/RecycleBin.jsx";

function AdminProtected({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/login" element={<Login />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminProtected><Dashboard /></AdminProtected>} />
            <Route path="/admin/students" element={<AdminProtected><Students /></AdminProtected>} />
            <Route path="/admin/students/new" element={<AdminProtected><AddStudent /></AdminProtected>} />
            <Route path="/admin/students/:id" element={<AdminProtected><StudentProfile /></AdminProtected>} />
            <Route path="/admin/batches" element={<AdminProtected><Batches /></AdminProtected>} />
            <Route path="/admin/batches/:id" element={<AdminProtected><BatchDetail /></AdminProtected>} />
            <Route path="/admin/fees/pending" element={<AdminProtected><PendingFees /></AdminProtected>} />
            <Route path="/admin/fee-structure" element={<AdminProtected><FeeStructure /></AdminProtected>} />
            <Route path="/admin/courses" element={<AdminProtected><FeeStructure /></AdminProtected>} />
            <Route path="/admin/collections/daily" element={<AdminProtected><CollectionsDaily /></AdminProtected>} />
            <Route path="/admin/collections/monthly" element={<AdminProtected><CollectionsMonthly /></AdminProtected>} />
            <Route path="/admin/reports/monthly" element={<AdminProtected><CollectionsMonthly /></AdminProtected>} />
            <Route path="/admin/payments" element={<AdminProtected><Payments /></AdminProtected>} />
            <Route path="/admin/expenses" element={<AdminProtected><Expenses /></AdminProtected>} />
            <Route path="/admin/reports" element={<AdminProtected><Reports /></AdminProtected>} />
            <Route path="/admin/notifications" element={<AdminProtected><Notifications /></AdminProtected>} />
            <Route path="/admin/recycle-bin" element={<AdminProtected><RecycleBin /></AdminProtected>} />
            <Route path="/admin/settings" element={<AdminProtected><Settings /></AdminProtected>} />
            <Route path="/admin/audit" element={<AdminProtected><AuditLog /></AdminProtected>} />

            <Route path="*" element={<div className="min-h-screen bg-slate-50 grid place-items-center p-8 text-center"><div><div className="text-lg font-bold text-slate-900">Page not found</div><a href="/admin/dashboard" className="text-sm text-brand-600 hover:underline mt-2 inline-block">Go to dashboard</a></div></div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
