import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, TrendingUp, TrendingDown, GraduationCap, Calendar, Clock, MapPin, BookOpen, Sparkles } from "lucide-react";
import { api, formatINR, formatDate } from "../api/client.js";
import { Card, Button, Badge, Avatar, StatCard, PageHeader, LoadingState, EmptyState } from "../components/ui.jsx";
import FeeStatusBadge from "../components/FeeStatusBadge.jsx";

export default function BatchDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api(`/api/batches/${id}`).then(setData).finally(() => setLoading(false)); }, [id]);
  if (loading) return <LoadingState />;
  if (!data) return <div className="text-sm text-slate-500">Batch not found.</div>;
  const b = data.batch;
  const fill = b.capacity ? Math.round(((data.students?.length || 0) / b.capacity) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 overflow-x-hidden">
      <Link
        to="/admin/batches"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to batches
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-purple-600 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-2xl sm:text-3xl font-bold truncate">{b.name}</div>
              <div className="text-white/70 text-sm mt-1 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {b.course}
                <span className="text-white/40">·</span>
                {b.teacher}
              </div>
            </div>
            <Badge variant="success" className="shrink-0 bg-white/20 text-white border-white/30">
              Active
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-white/80">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{(b.days || []).join(" · ")}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{b.startTime} – {b.endTime}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{b.room || "No room"}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <StatCard
          title="Students"
          value={`${data.students?.length || 0} / ${b.capacity || 0}`}
          icon={Users}
          color={fill >= 90 ? "danger" : fill >= 70 ? "warning" : "success"}
        />
        <StatCard
          title="Collected"
          value={formatINR(data.collected || 0)}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Pending"
          value={formatINR(data.pending || 0)}
          icon={TrendingDown}
          color="warning"
        />
        <StatCard
          title="Capacity"
          value={`${fill}%`}
          icon={BookOpen}
          color={fill >= 90 ? "danger" : "brand"}
        />
      </div>

      {/* Students */}
      <Card className="overflow-hidden w-full min-w-0 ring-1 ring-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-sm font-semibold text-slate-900">Students</span>
            <Badge variant="default">{data.students?.length || 0}</Badge>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase text-slate-500 font-medium">
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-right px-4 py-3">Paid</th>
                <th className="text-right px-4 py-3">Pending</th>
                <th className="text-left px-4 py-3">Next due</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.students || []).map((s, idx) => (
                <tr key={s.id} className={`border-t border-slate-100 hover:bg-brand-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <div className="min-w-0">
                        <Link to={`/students/${s.id}`} className="font-medium text-slate-900 hover:text-brand-600 hover:underline block truncate">{s.name}</Link>
                        <div className="text-xs text-slate-400 font-mono">{s.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-success-600">{formatINR(s.paid)}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-warning-600">{formatINR(s.pending)}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(s.nextDueDate)}</td>
                  <td className="px-4 py-3.5"><FeeStatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden grid gap-3 p-4">
          {(data.students || []).length === 0 ? (
            <EmptyState title="No students" description="No students in this batch yet." icon={Users} />
          ) : (
            (data.students || []).map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-200 transition-colors">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={s.name} size="md" />
                    <div className="min-w-0">
                      <Link to={`/students/${s.id}`} className="font-medium hover:underline text-sm truncate block text-slate-900">{s.name}</Link>
                      <div className="text-xs text-slate-400 font-mono truncate">{s.studentId}</div>
                      <div className="text-xs text-slate-500 mt-1">Due {formatDate(s.nextDueDate)}</div>
                    </div>
                  </div>
                  <FeeStatusBadge status={s.status} />
                </div>
                <div className="grid grid-cols-2 gap-2.5 mt-4 text-sm">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-success-50 to-success-100/50 border border-success-200/50 text-center min-w-0">
                    <div className="text-[11px] text-success-600 font-medium">Paid</div>
                    <div className="font-mono font-bold text-success-700 truncate">{formatINR(s.paid)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100/50 border border-warning-200/50 text-center min-w-0">
                    <div className="text-[11px] text-warning-600 font-medium">Pending</div>
                    <div className="font-mono font-bold text-warning-700 truncate">{formatINR(s.pending)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
