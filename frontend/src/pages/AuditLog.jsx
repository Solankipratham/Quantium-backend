import { useEffect, useState } from "react";
import { api, formatDateTime } from "../api/client.js";
import { Card, LoadingState, EmptyState, PageHeader } from "../components/ui.jsx";
import { Shield, Clock, User, Globe, Activity } from "lucide-react";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api("/api/audit-logs").then((r) => setLogs(r.logs || [])).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full min-w-0 overflow-x-hidden">
      <PageHeader title="Audit Log" subtitle="Every important action is tracked here." />

      {logs.length === 0 ? (
        <EmptyState title="No activity yet" description="Actions like payments and student updates will appear here." icon={Activity} />
      ) : (
        <>
          <Card className="hidden lg:block overflow-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Time</div>
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />User</div>
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Action</div>
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />IP</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={l.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{formatDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-bold">
                          {(l.userName || "—")[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-900">{l.userName || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{l.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="lg:hidden grid gap-3">
            {logs.map((l) => (
              <Card key={l.id} className="p-4 w-full min-w-0 overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 text-xs font-bold">
                    {(l.userName || "—")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{l.userName || "—"}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {l.action}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(l.createdAt)}</span>
                      {l.ip ? <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{l.ip}</span> : null}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
