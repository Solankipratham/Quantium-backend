import { useEffect, useState } from "react";
import { api, formatDate } from "../api/client.js";
import { Card, Button, Input, LoadingState, EmptyState, Badge, Avatar, PageHeader, StatCard } from "../components/ui.jsx";
import { Trash2, RotateCcw, Search, AlertTriangle, Clock, UserX } from "lucide-react";

export default function RecycleBin() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const r = await api(`/api/students/deleted${params}`);
      setStudents(r.students || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]);

  const restore = async (s) => {
    if (!confirm(`Restore ${s.name} (${s.studentId})?`)) return;
    await api(`/api/students/${s.id}/restore`, { method: "POST" });
    load();
  };

  const permanentDelete = async (s) => {
    if (!confirm(`WARNING\n\nThis will permanently delete ${s.name} (${s.studentId}) and all associated payments.\n\nThis cannot be undone.\n\n[Cancel] to keep, [OK] to permanently delete.`)) return;
    if (!confirm(`Final confirmation: Permanently delete ${s.name}?`)) return;
    await api(`/api/students/${s.id}/permanent`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 overflow-x-hidden">
      <PageHeader title="Recycle Bin" subtitle="Deleted students are stored here until restored or permanently removed." />

      <Card className="p-5 sm:p-6 bg-gradient-to-br from-danger-500 to-rose-600 border-danger-200 text-white overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">{students.length}</div>
            <div className="text-sm text-white/80 font-medium">Deleted Students</div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full min-w-0">
        <div className="relative w-full sm:w-auto shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID, phone, email..." className="pl-9 w-full sm:w-[280px]" />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-danger-50 border border-danger-200 text-danger-700 text-sm p-4 font-medium w-full min-w-0 break-words overflow-hidden">{error}</div>
      ) : null}

      {loading ? <LoadingState label="Loading recycle bin..." /> : students.length === 0 ? (
        <EmptyState title="Recycle Bin is empty" description="Deleted students will appear here. You can restore them or permanently delete." icon={Trash2} />
      ) : (
        <>
          <Card className="hidden lg:block overflow-x-auto w-full min-w-0 p-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course/Batch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deleted</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" />
                        <div>
                          <div className="font-semibold text-slate-900">{s.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{s.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="info">{s.course || "—"}</Badge>
                      <span className="text-xs text-slate-400 ml-2">{s.batch || "—"}</span>
                    </td>
                    <td className="px-4 py-4 text-xs font-mono text-slate-600">{s.phone} {s.email ? `· ${s.email}`: ""}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-danger-600">
                        <Clock className="w-3 h-3" />
                        {formatDate(s.deleted_at)}
                      </div>
                      <div className="text-[11px] text-slate-400">{s.deleted_by ? `by ${s.deleted_by.slice(0,8)}` : ""}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="success-outline" onClick={() => restore(s)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />Restore
                        </Button>
                        <Button size="sm" variant="danger-outline" onClick={() => permanentDelete(s)}>
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="lg:hidden grid gap-3 w-full min-w-0">
            {students.map((s) => (
              <Card key={s.id} className="p-4 w-full min-w-0 overflow-hidden border-l-4 border-l-danger-400">
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{s.studentId}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="info">{s.course}</Badge>
                      <Badge variant="default">{s.batch}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-danger-600 mt-2">
                      <Clock className="w-3 h-3" />
                      Deleted {formatDate(s.deleted_at)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
                  <Button className="flex-1" size="sm" variant="success-outline" onClick={() => restore(s)}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />Restore
                  </Button>
                  <Button className="flex-1" variant="danger-outline" size="sm" onClick={() => permanentDelete(s)}>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
