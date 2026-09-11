import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatINR, formatDate } from "../api/client.js";
import { Card, Button, LoadingState, EmptyState, Badge, StatCard, PageHeader, Input, Select, Avatar } from "../components/ui.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import { AlertTriangle, Clock, CalendarClock, TrendingDown, Users, Search } from "lucide-react";

export default function PendingFees() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payFor, setPayFor] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = () => {
    setLoading(true);
    api("/api/fees/pending").then(setData).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const statusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "PAID") return <Badge variant="success" dot>PAID</Badge>;
    if (s === "PARTIAL") return <Badge variant="info" dot>PARTIAL</Badge>;
    if (s === "DUE SOON" || s === "DUE_SOON") return <Badge variant="warning" dot>DUE SOON</Badge>;
    if (s === "DUE TODAY") return <Badge variant="warning" dot>DUE TODAY</Badge>;
    if (s === "OVERDUE") return <Badge variant="danger" dot>OVERDUE</Badge>;
    return <Badge variant="muted">{status || "PENDING"}</Badge>;
  };

  if (loading) return <LoadingState label="Loading pending fees..." />;
  if (!data) return <div className="text-sm text-slate-500">Failed to load.</div>;

  const students = data.students || [];
  const filteredStudents = students.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (![s.name, s.studentId, s.batch, s.course].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))) return false;
    }
    if (filterCourse !== "all" && s.course !== filterCourse) return false;
    if (filterBatch !== "all" && s.batch !== filterBatch) return false;
    if (filterStatus !== "all") {
      const cs = String(s.currentMonth?.status || s.status || "").toUpperCase().replace(/\s+/g, "_");
      if (filterStatus === "OVERDUE" && cs !== "OVERDUE") return false;
      if (filterStatus === "DUE_SOON" && cs !== "DUE_SOON" && cs !== "DUE_TODAY") return false;
      if (filterStatus === "PAID" && cs !== "PAID") return false;
      if (filterStatus === "PARTIAL" && cs !== "PARTIAL") return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Pending Fees"
        subtitle={`${students.length} student${students.length !== 1 ? "s" : ""} with outstanding balances — sorted by highest pending first.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <StatCard
          title="Total Pending"
          value={formatINR(data.summary.totalPending)}
          icon={TrendingDown}
          color="warning"
          subtitle="Outstanding balance"
        />
        <StatCard
          title="Due Soon"
          value={data.summary.dueSoon || 0}
          icon={Clock}
          color="info"
          subtitle="Within 5 days"
        />
        <StatCard
          title="Due Today"
          value={data.summary.studentsPending - (data.summary.overdue || 0) - (data.summary.dueSoon || 0)}
          icon={CalendarClock}
          color="warning"
          subtitle="Payments due today"
        />
        <StatCard
          title="Overdue"
          value={data.summary.overdue || 0}
          icon={AlertTriangle}
          color="danger"
          subtitle="Requires attention"
        />
      </div>

      <Card className="p-4 w-full min-w-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>
          <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="w-full sm:w-[150px]">
            <option value="all">All Courses</option>
          </Select>
          <Select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="w-full sm:w-[150px]">
            <option value="all">All Batches</option>
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-[150px]">
            <option value="all">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="OVERDUE">Overdue</option>
          </Select>
        </div>
      </Card>

      {filteredStudents.length === 0 ? (
        <EmptyState
          title="No pending fees"
          description="All student fees are currently up to date."
          icon={Users}
        />
      ) : (
        <>
          <Card className="hidden lg:block overflow-x-auto w-full min-w-0">
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Course</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Batch</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Fee</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Paid</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Due</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-right px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const cur = s.currentMonth;
                  return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-brand-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{s.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{s.course || "—"}</td>
                      <td className="px-4 py-4"><Badge variant="purple">{s.batch}</Badge></td>
                      <td className="px-4 py-4 text-right font-mono text-slate-700">{formatINR(cur?.monthlyFee || s.finalFee)}</td>
                      <td className="px-4 py-4 text-right font-mono text-success-600">{formatINR(cur?.paid ?? s.paid)}</td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-danger-600">{formatINR(cur?.remaining ?? s.pending)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{formatDate(cur?.dueDate || s.nextDueDate)}</span>
                          {cur?.daysRemaining != null && cur.daysRemaining >= 0 && cur.daysRemaining <= 5 ? (
                            <Badge variant="warning" className="text-[10px]">{cur.daysRemaining}d left</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">{statusBadge(cur?.status || s.status)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link to={`/students/${s.id}`}>
                            <Button variant="secondary" size="sm">View</Button>
                          </Link>
                          <Button size="sm" variant="primary" onClick={() => setPayFor(s)}>Record Payment</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="lg:hidden grid gap-4 w-full min-w-0">
            {filteredStudents.map((s) => {
              const cur = s.currentMonth;
              return (
                <Card key={s.id} className="p-4 sm:p-5 w-full min-w-0 overflow-hidden hover:shadow-card-hover transition-shadow">
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={s.name} size="md" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{s.studentId} · {s.batch}</div>
                      </div>
                    </div>
                    {statusBadge(cur?.status || s.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="p-3 rounded-xl bg-slate-50 text-center">
                      <div className="text-[11px] font-medium text-slate-400 uppercase">Fee</div>
                      <div className="font-mono font-semibold text-sm text-slate-700 truncate">{formatINR(s.finalFee)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-success-50 text-center">
                      <div className="text-[11px] font-medium text-success-600 uppercase">Paid</div>
                      <div className="font-mono font-semibold text-sm text-success-700 truncate">{formatINR(s.paid)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-danger-50 text-center">
                      <div className="text-[11px] font-medium text-danger-600 uppercase">Pending</div>
                      <div className="font-mono font-bold text-sm text-danger-700 truncate">{formatINR(s.pending)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span>Due {formatDate(s.nextDueDate)}</span>
                    {s.daysOverdue ? <Badge variant="danger" className="text-[10px]">{s.daysOverdue}d overdue</Badge> : null}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
                    <Link to={`/students/${s.id}`} className="flex-1 min-w-0">
                      <Button variant="secondary" className="w-full">View Details</Button>
                    </Link>
                    <Button className="flex-1" variant="primary" onClick={() => setPayFor(s)}>Record Payment</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <PaymentModal open={!!payFor} onClose={() => setPayFor(null)} student={payFor} onSuccess={load} />
    </div>
  );
}
