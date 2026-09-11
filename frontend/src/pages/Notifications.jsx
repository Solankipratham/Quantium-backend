import { useEffect, useState } from "react";
import { api, formatDateTime } from "../api/client.js";
import { Card, Button, LoadingState, EmptyState, Badge, PageHeader } from "../components/ui.jsx";
import { Bell, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

const typeConfig = {
  student_created: { icon: CheckCircle, color: "success", label: "Student" },
  payment_received: { icon: CheckCircle, color: "primary", label: "Payment" },
  payment_overdue: { icon: AlertTriangle, color: "warning", label: "Overdue" },
  reminder: { icon: Bell, color: "info", label: "Reminder" },
  system: { icon: Info, color: "muted", label: "System" },
};

export default function Notifications() {
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api("/api/notifications").then(setData).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markAll = async () => { await api("/api/notifications/read-all", { method: "PUT" }); load(); };
  const clear = async () => { if (!confirm("Clear all notifications?")) return; await api("/api/notifications", { method: "DELETE" }); load(); };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Notifications"
        subtitle={`${data.unread} unread · ${data.notifications.length} total`}
        action={
          <>
            <Button variant="secondary" onClick={markAll} icon={CheckCheck}>Mark all read</Button>
            <Button variant="ghost" onClick={clear} icon={Trash2}>Clear</Button>
          </>
        }
      />

      {data.notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Activity like new students and payments will appear here."
          icon={Bell}
        />
      ) : (
        <div className="space-y-2 w-full min-w-0">
          {data.notifications.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.system;
            const Icon = cfg.icon;
            return (
              <Card key={n.id} className={`p-4 sm:p-5 w-full min-w-0 overflow-hidden transition-all duration-200 ${n.read ? "opacity-60 border-slate-100" : "border-l-4 border-l-brand-500 shadow-sm"}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full min-w-0">
                  <div className="min-w-0 flex-1 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      cfg.color === "success" ? "bg-success-100 text-success-600" :
                      cfg.color === "primary" ? "bg-brand-100 text-brand-600" :
                      cfg.color === "warning" ? "bg-warning-100 text-warning-600" :
                      cfg.color === "info" ? "bg-info-100 text-info-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Badge variant={cfg.color}>{cfg.label}</Badge>
                        <span className="text-sm font-semibold text-slate-900 break-words">{n.title}</span>
                      </div>
                      <div className="text-sm text-slate-600 mt-1 break-words">{n.message}</div>
                      <div className="text-xs text-slate-400 mt-1.5">{formatDateTime(n.createdAt)}</div>
                    </div>
                  </div>
                  {!n.read ? (
                    <Button size="sm" variant="outline" onClick={async () => { await api(`/api/notifications/${n.id}/read`, { method: "PUT" }); load(); }} className="w-full sm:w-auto shrink-0">
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
