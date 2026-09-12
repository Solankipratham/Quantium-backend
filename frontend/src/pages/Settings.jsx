import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Card, Button, Input, Label, Select, PageHeader, LoadingState } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Save, Lock, Building2, CreditCard, Receipt, ShieldCheck } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });

  const load = () => {
    api("/api/settings").then((r) => setSettings(r.settings)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const r = await api("/api/settings", { method: "PUT", body: settings });
      setSettings(r.settings);
      setMsg("Settings saved.");
    } catch (err) { setMsg(err.message); }
    finally { setSaving(false); }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api("/api/auth/change-password", { method: "POST", body: pwd });
      setMsg("Password updated.");
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (err) { setMsg(err.message); }
  };

  if (loading) return <LoadingState />;
  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader title="Settings" subtitle="Coaching profile, fee defaults, receipts, and account security." />

      {msg ? (
        <div className="rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 text-sm p-4 font-medium w-full min-w-0 break-words overflow-hidden">{msg}</div>
      ) : null}

      <form onSubmit={save} className="space-y-5 w-full min-w-0">
        <Card className="p-0 w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-purple-50">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center"><Building2 className="w-4 h-4" /></div>
            <div className="text-sm font-semibold text-slate-900">Coaching Profile</div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
              <div className="min-w-0"><Label>Name</Label><Input value={settings?.coaching?.name || ""} onChange={(e) => setSettings({ ...settings, coaching: { ...settings.coaching, name: e.target.value } })} /></div>
              <div className="min-w-0"><Label>Tagline</Label><Input value={settings?.coaching?.tagline || ""} onChange={(e) => setSettings({ ...settings, coaching: { ...settings.coaching, tagline: e.target.value } })} /></div>
              <div className="min-w-0"><Label>Phone</Label><Input value={settings?.coaching?.phone || ""} onChange={(e) => setSettings({ ...settings, coaching: { ...settings.coaching, phone: e.target.value } })} /></div>
              <div className="min-w-0"><Label>Email</Label><Input value={settings?.coaching?.email || ""} onChange={(e) => setSettings({ ...settings, coaching: { ...settings.coaching, email: e.target.value } })} /></div>
              <div className="sm:col-span-2 min-w-0"><Label>Address</Label><Input value={settings?.coaching?.address || ""} onChange={(e) => setSettings({ ...settings, coaching: { ...settings.coaching, address: e.target.value } })} /></div>
            </div>
          </div>
        </Card>

        <Card className="p-0 w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-success-50 to-emerald-50">
            <div className="w-9 h-9 rounded-xl bg-success-100 text-success-600 flex items-center justify-center"><CreditCard className="w-4 h-4" /></div>
            <div className="text-sm font-semibold text-slate-900">Fee Settings</div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
              <div className="min-w-0"><Label>Default due date (1–31)</Label><Input type="number" min="1" max="31" value={settings?.fee?.defaultDueDate || 10} onChange={(e) => setSettings({ ...settings, fee: { ...settings.fee, defaultDueDate: Number(e.target.value) } })} /></div>
              <div className="min-w-0"><Label>Default cycle</Label><Select value={settings?.fee?.defaultPaymentCycle || "Monthly"} onChange={(e) => setSettings({ ...settings, fee: { ...settings.fee, defaultPaymentCycle: e.target.value } })}><option>Monthly</option><option>Quarterly</option><option>Half-Yearly</option><option>Yearly</option></Select></div>
              <div className="flex items-center gap-2 pt-2 sm:pt-6 min-w-0 sm:col-span-2">
                <input type="checkbox" checked={!!settings?.fee?.allowAdvancePayments} onChange={(e) => setSettings({ ...settings, fee: { ...settings.fee, allowAdvancePayments: e.target.checked } })} className="w-4 h-4 rounded border-slate-300 text-success-600 focus:ring-success-500 shrink-0" />
                <Label className="normal-case">Allow advance payments (over outstanding)</Label>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-0 w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-info-50 to-blue-50">
            <div className="w-9 h-9 rounded-xl bg-info-100 text-info-600 flex items-center justify-center"><Receipt className="w-4 h-4" /></div>
            <div className="text-sm font-semibold text-slate-900">Receipt Settings</div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
              <div className="min-w-0"><Label>Prefix</Label><Input value={settings?.receipt?.prefix || "QTM"} onChange={(e) => setSettings({ ...settings, receipt: { ...settings.receipt, prefix: e.target.value } })} /></div>
              <div className="min-w-0"><Label>Pattern</Label><Input value={settings?.receipt?.pattern || "{prefix}-{number}"} onChange={(e) => setSettings({ ...settings, receipt: { ...settings.receipt, pattern: e.target.value } })} placeholder="{prefix}-{number}" /></div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end w-full">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto" icon={Save}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>

      <Card className="p-0 w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-danger-50 to-red-50">
          <div className="w-9 h-9 rounded-xl bg-danger-100 text-danger-600 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div>
          <div className="text-sm font-semibold text-slate-900">Account — {user?.email}</div>
        </div>
        <form onSubmit={changePwd} className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
            <div className="min-w-0"><Label>Current password</Label><Input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} /></div>
            <div className="min-w-0"><Label>New password</Label><Input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} /></div>
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 w-full">
              <Button type="submit" className="w-full sm:w-auto" icon={Lock}>Change Password</Button>
              <Button type="button" variant="secondary" onClick={logout} className="w-full sm:w-auto">Logout</Button>
            </div>
          </div>
        </form>
      </Card>

      <Card className="p-0 w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div>
          <div className="flex items-center justify-between flex-1">
            <div className="text-sm font-semibold text-slate-900">Audit Log</div>
            <a href="/admin/audit" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">View full audit log →</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
