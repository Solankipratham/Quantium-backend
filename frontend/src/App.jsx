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

function Protected({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/students" element={<Protected><Students /></Protected>} />
            <Route path="/students/new" element={<Protected><AddStudent /></Protected>} />
            <Route path="/students/:id" element={<Protected><StudentProfile /></Protected>} />
            <Route path="/batches" element={<Protected><Batches /></Protected>} />
            <Route path="/batches/:id" element={<Protected><BatchDetail /></Protected>} />
            <Route path="/fees/pending" element={<Protected><PendingFees /></Protected>} />
            <Route path="/fee-structure" element={<Protected><FeeStructure /></Protected>} />
            <Route path="/courses" element={<Protected><FeeStructure /></Protected>} />
            <Route path="/collections/daily" element={<Protected><CollectionsDaily /></Protected>} />
            <Route path="/collections/monthly" element={<Protected><CollectionsMonthly /></Protected>} />
            <Route path="/reports/monthly" element={<Protected><CollectionsMonthly /></Protected>} />
            <Route path="/payments" element={<Protected><Payments /></Protected>} />
            <Route path="/expenses" element={<Protected><Expenses /></Protected>} />
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
            <Route path="/recycle-bin" element={<Protected><RecycleBin /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/audit" element={<Protected><AuditLog /></Protected>} />
            <Route path="*" element={<div className="min-h-screen bg-slate-50 grid place-items-center p-8 text-center"><div><div className="text-lg font-bold text-slate-900">Page not found</div><a href="/dashboard" className="text-sm text-brand-600 hover:underline mt-2 inline-block">Go to dashboard</a></div></div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
