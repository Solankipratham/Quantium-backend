import { useEffect, useState } from "react";
import { api, formatINR } from "../api/client.js";
import { Card, Button, StatCard, Badge, PageHeader, LoadingState } from "../components/ui.jsx";
import { BarChart } from "../components/Charts.jsx";
import { Download, Printer, FileText, Users, IndianRupee, TrendingUp, AlertCircle, BarChart3 } from "lucide-react";

function toCSV(rows, headers) {
  const head = headers.join(",");
  const body = rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  return head + "\n" + body;
}

function download(filename, content, mime = "text/csv") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api("/api/reports/all").then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <LoadingState />;
  if (!data) return <div className="text-sm text-slate-500">Failed to load reports.</div>;

  const students = data.students?.students || [];
  const batches = data.batches || [];
  const methods = data.methods?.breakdown || [];

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Reports"
        subtitle="Export Excel, PDF, or print — comprehensive coaching analytics."
        action={
          <>
            <Button variant="secondary" onClick={() => window.print()} icon={Printer}>Print</Button>
            <Button variant="secondary" onClick={() => {
              const rows = students.map((s) => ({ Name: s.name, ID: s.studentId, Batch: s.batch, Course: s.course, Paid: s.paid, Pending: s.pending, Status: s.status }));
              download("quantum-students.csv", toCSV(rows, ["Name","ID","Batch","Course","Paid","Pending","Status"]));
            }} icon={Download}>Export Excel</Button>
            <Button onClick={() => window.print()} icon={FileText}>Export PDF</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <StatCard
          title="All Students"
          value={data.students?.total || 0}
          subtitle={`${data.students?.active || 0} active · ${data.students?.inactive || 0} inactive`}
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Fees Collected"
          value={formatINR(data.fees?.totalCollected || 0)}
          icon={IndianRupee}
          color="success"
        />
        <StatCard
          title="Fees Pending"
          value={formatINR(data.fees?.totalPending || 0)}
          icon={AlertCircle}
          color="warning"
        />
        <StatCard
          title="Expenses"
          value={formatINR(data.expenses?.total || 0)}
          subtitle={`${data.expenses?.count || 0} records`}
          icon={TrendingUp}
          color="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full min-w-0">
        <Card className="p-0 w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-success-50 to-emerald-50">
            <div className="w-9 h-9 rounded-xl bg-success-100 text-success-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            <div className="text-sm font-semibold text-slate-900">Fee Status</div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm w-full">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-success-500 to-emerald-600 text-white shadow-sm">
                <div className="text-xs text-white/80 font-medium">Paid</div>
                <div className="text-2xl font-bold mt-1">{data.fees?.paid || 0}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-warning-50 to-amber-50 border border-warning-200">
                <div className="text-xs text-warning-600 font-medium">Partial</div>
                <div className="text-2xl font-bold mt-1 text-warning-700">{data.fees?.partial || 0}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-info-50 to-blue-50 border border-info-200">
                <div className="text-xs text-info-600 font-medium">Pending</div>
                <div className="text-2xl font-bold mt-1 text-info-700">{data.fees?.pending || 0}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-danger-50 to-red-50 border border-danger-200">
                <div className="text-xs text-danger-600 font-medium">Overdue</div>
                <div className="text-2xl font-bold mt-1 text-danger-700">{data.fees?.overdue || 0}</div>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-0 w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-violet-50">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><BarChart3 className="w-4 h-4" /></div>
            <div className="text-sm font-semibold text-slate-900">Payment Methods</div>
          </div>
          <div className="p-5 sm:p-6">
            <BarChart data={methods.map((m) => ({ label: m.method, total: m.amount }))} />
          </div>
        </Card>
      </div>

      <Card className="p-0 w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-indigo-50">
          <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center"><Users className="w-4 h-4" /></div>
          <div className="text-sm font-semibold text-slate-900">Batch Report — Students, Collected, Pending</div>
        </div>
        <div className="p-0">
          <div className="hidden lg:block overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{b.name}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge variant="primary">{b.studentCount} students</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-success-600">{formatINR(b.collected)}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-warning-600">{formatINR(b.pending)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge variant={b.collectionPercent >= 80 ? "success" : b.collectionPercent >= 50 ? "warning" : "danger"}>
                        {b.collectionPercent}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden grid gap-3 p-4">
            {batches.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-100 bg-white min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-900 truncate">{b.name}</div>
                  <Badge variant={b.collectionPercent >= 80 ? "success" : b.collectionPercent >= 50 ? "warning" : "danger"}>
                    {b.collectionPercent}%
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 mb-3">{b.studentCount} students</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-success-500 to-emerald-600 text-white text-center">
                    <div className="text-white/80 text-[10px] font-medium uppercase">Collected</div>
                    <div className="font-mono font-bold mt-0.5">{formatINR(b.collected)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-warning-50 to-amber-50 border border-warning-200 text-center">
                    <div className="text-warning-600 text-[10px] font-medium uppercase">Pending</div>
                    <div className="font-mono font-bold mt-0.5 text-warning-700">{formatINR(b.pending)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-0 w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-info-50 to-cyan-50">
          <div className="w-9 h-9 rounded-xl bg-info-100 text-info-600 flex items-center justify-center"><BarChart3 className="w-4 h-4" /></div>
          <div className="text-sm font-semibold text-slate-900">Collection — Monthly</div>
        </div>
        <div className="p-5 sm:p-6">
          <BarChart data={(data.collections || []).slice(-6).map((c) => ({ label: c.label, total: c.total }))} />
        </div>
      </Card>
    </div>
  );
}
