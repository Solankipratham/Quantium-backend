import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Wallet, Clock3, IndianRupee,
  AlertTriangle, Layers, Calendar, BarChart3,
  Plus, Receipt, FileBarChart, CheckCircle,
} from "lucide-react";
import { api, formatINR, formatDate } from "../api/client.js";
import {
  Card, Button, Badge, Avatar, EmptyState, LoadingState,
  StatCard, StatSkeleton, PageHeader,
} from "../components/ui.jsx";
import { LineChart, BarChart, Donut } from "../components/Charts.jsx";
import PaymentModal from "../components/PaymentModal.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api("/api/dashboard")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Overview of your coaching business" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><Card className="p-6 h-64"><LoadingState label="Loading charts..." /></Card></div>
          <Card className="p-6 h-64"><LoadingState label="Loading..." /></Card>
        </div>
      </div>
    );
  }
  if (!data) return <div className="text-sm text-slate-500">Failed to load dashboard.</div>;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your coaching business"
        action={
          <div className="flex gap-2">
            <Link to="/students/new">
              <Button variant="primary" size="sm"><Plus className="w-4 h-4" /> New Student</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setPayOpen(true)}>
              <Receipt className="w-4 h-4" /> Record Payment
            </Button>
          </div>
        }
      />

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Students"
          value={data.totalStudents}
          subtitle={`${data.activeStudents} active`}
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Active Students"
          value={data.activeStudents}
          subtitle={`${data.totalStudents - data.activeStudents} inactive`}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Total Collected"
          value={formatINR(data.totalCollected)}
          subtitle={`${data.paidStudents} paid · ${data.partialStudents} partial`}
          icon={IndianRupee}
          color="success"
        />
        <StatCard
          title="Pending Fees"
          value={formatINR(data.totalPending)}
          subtitle={`${data.pendingStudents} students`}
          icon={Clock3}
          color="warning"
        />
        <StatCard
          title="Today's Collection"
          value={formatINR(data.todayCollection)}
          subtitle={`${data.todayPaymentCount} payments`}
          icon={Wallet}
          color="info"
        />
        <StatCard
          title="Overdue"
          value={data.overdueStudents}
          subtitle={`${data.dueToday} due today`}
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-2">
        <Link to="/students">
          <Button variant="secondary" size="sm" className="gap-1.5"><Users className="w-4 h-4" /> View Students</Button>
        </Link>
        <Link to="/fees/pending">
          <Button variant="secondary" size="sm" className="gap-1.5"><Clock3 className="w-4 h-4" /> Pending Fees</Button>
        </Link>
        <Link to="/reports">
          <Button variant="ghost" size="sm" className="gap-1.5"><FileBarChart className="w-4 h-4" /> Reports</Button>
        </Link>
      </div>

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Monthly Collection</div>
              <div className="text-xs text-slate-500 mt-0.5">Fee collections over time</div>
            </div>
            <Badge variant="success" dot>{formatINR(data.monthCollection)} this month</Badge>
          </div>
          {data.charts?.monthSeries?.length ? (
            <LineChart data={data.charts.monthSeries} />
          ) : (
            <EmptyState icon={BarChart3} title="No collection data" description="Start recording payments to see trends." />
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Fee Status</div>
              <div className="text-xs text-slate-500 mt-0.5">Paid vs pending</div>
            </div>
          </div>
          <Donut
            paid={data.charts?.paidVsPending?.paid || 0}
            partial={data.charts?.paidVsPending?.partial || 0}
            pending={data.charts?.paidVsPending?.pending || 0}
          />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-900 mb-4">Daily Collection (last 7 days)</div>
          {data.charts?.dailySeries?.length ? (
            <BarChart data={data.charts.dailySeries} />
          ) : (
            <EmptyState icon={Calendar} title="No daily data" description="Record payments to see a daily breakdown." />
          )}
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-900 mb-4">Batch-wise Collection</div>
          {data.charts?.batchWise?.length ? (
            <BarChart data={data.charts.batchWise.map((b) => ({ label: b.name, total: b.collected }))} />
          ) : (
            <EmptyState icon={Layers} title="No batch data" description="Create batches to track collection by class." />
          )}
        </Card>
      </div>

      {/* ── Recent Payments Table ── */}
      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Recent Payments</div>
            <div className="text-xs text-slate-500 mt-0.5">Latest recorded transactions</div>
          </div>
          <Badge variant="muted">{data.recentPayments?.length || 0} today</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-100">
                <th className="text-left font-medium text-slate-500 px-5 py-3">Student</th>
                <th className="text-right font-medium text-slate-500 px-5 py-3">Amount</th>
                <th className="text-center font-medium text-slate-500 px-5 py-3 hidden sm:table-cell">Method</th>
                <th className="text-left font-medium text-slate-500 px-5 py-3 hidden md:table-cell">Date</th>
                <th className="text-left font-medium text-slate-500 px-5 py-3 hidden lg:table-cell">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayments?.length ? (
                data.recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.studentName} size="sm" />
                        <span className="font-medium text-slate-900">{p.studentName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-success-700">{formatINR(p.amount)}</td>
                    <td className="px-5 py-3 text-center hidden sm:table-cell">
                      <Badge variant={p.method === "Cash" ? "info" : p.method === "Online" ? "purple" : "default"}>
                        {p.method}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{formatDate(p.date)}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-400">{p.receiptNumber}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5}><EmptyState icon={IndianRupee} title="No payments today" description="Payments will appear here once recorded." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Due Soon & Overdue ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning-100 text-warning-600 grid place-items-center">
                <Clock3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Due Today</div>
                <div className="text-xs text-slate-500">{data.dueTodayList?.length || 0} students</div>
              </div>
            </div>
          </div>
          {data.dueTodayList?.length ? (
            <div className="space-y-2">
              {data.dueTodayList.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={s.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.batch}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-warning-700 shrink-0">{formatINR(s.pending)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle} title="All clear" description="No fees due today." />
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-danger-100 text-danger-600 grid place-items-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Overdue</div>
                <div className="text-xs text-slate-500">{data.overdueList?.length || 0} students</div>
              </div>
            </div>
            {data.overdueList?.length ? (
              <Badge variant="danger" dot>{data.overdueStudents} overdue</Badge>
            ) : null}
          </div>
          {data.overdueList?.length ? (
            <div className="space-y-2">
              {data.overdueList.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-danger-50/50 hover:bg-danger-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={s.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                      <div className="text-xs text-danger-600">{s.daysOverdue} days overdue</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-danger-700 shrink-0">{formatINR(s.pending)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={AlertTriangle} title="No overdue students" description="Everyone is on track." />
          )}
        </Card>
      </div>

      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onSuccess={load} />
    </div>
  );
}
