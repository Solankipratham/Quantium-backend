import { useEffect, useState } from "react";
import { api, formatINR, formatDate } from "../api/client.js";
import { Card, Input, Select, LoadingState, EmptyState, Badge, PageHeader, StatCard, Avatar, ProgressBar } from "../components/ui.jsx";
import { TrendingUp, Wallet, AlertTriangle, Users, BarChart3, Search, Clock } from "lucide-react";

export default function CollectionsMonthly() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState("all");
  const [course, setCourse] = useState("all");
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  const load = () => {
    setLoading(true);
    api(`/api/collections/monthly?date=${date}`).then(setData).finally(() => setLoading(false));
    api("/api/students/filters").then((r) => {
      setBatches(r.batches || []);
      setCourses(r.courses || []);
    }).catch((error) => {
      console.error("Failed to load student filters:", error);
      setBatches([]);
      setCourses([]);
    });
  };
  useEffect(load, [date]);

  if (loading) return <LoadingState label="Loading monthly collection..." />;

  const filteredPayments = (data?.payments || []).filter((p) => {
    if (batch !== "all" && p.studentBatch !== batch) return false;
    if (course !== "all" && p.studentCourse !== course) return false;
    if (search) {
      const q = search.toLowerCase();
      return [p.studentName, p.studentId, p.receiptNumber, p.transactionId, p.paymentFor].filter(Boolean).some((v)=>String(v).toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Monthly Collection"
        subtitle={`${data?.label} · ${filteredPayments.length} of ${data?.paymentCount||0} payments`}
        action={
          <Input type="month" value={date.slice(0,7)} onChange={(e) => setDate(e.target.value + "-15")} className="w-full sm:w-[170px]" />
        }
      />

      <Card className="p-4 w-full min-w-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>
          <Select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full sm:w-[160px]">
            <option value="all">All Batches</option>
            {batches.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full sm:w-[150px]">
            <option value="all">All Courses</option>
            {courses.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
        <StatCard
          title="Expected"
          value={formatINR(data?.expected || 0)}
          icon={BarChart3}
          color="brand"
          subtitle="Monthly target"
        />
        <StatCard
          title="Collected"
          value={formatINR(data?.collected || 0)}
          icon={TrendingUp}
          color="success"
          subtitle={`${data?.collectionPercent || 0}% achieved`}
        />
        <StatCard
          title="Pending"
          value={formatINR(data?.pending || 0)}
          icon={Clock}
          color="warning"
          subtitle="Awaiting payment"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <StatCard
          title="Overdue"
          value={data?.overdueStudents || 0}
          icon={AlertTriangle}
          color="danger"
          subtitle="Requires attention"
        />
        <StatCard
          title="Payments"
          value={data?.paymentCount || 0}
          icon={Wallet}
          color="info"
          subtitle="Total transactions"
        />
        <StatCard
          title="Total Students"
          value={data?.totalStudents || 0}
          icon={Users}
          color="purple"
          subtitle="Active students"
        />
        <StatCard
          title="Collection %"
          value={`${data?.collectionPercent || 0}%`}
          icon={BarChart3}
          color={Number(data?.collectionPercent || 0) >= 80 ? "success" : Number(data?.collectionPercent || 0) >= 50 ? "warning" : "danger"}
          subtitle="Of expected"
        />
      </div>

      <Card className="p-5 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">Collection Progress</span>
          <span className="text-sm font-bold text-brand-600">{data?.collectionPercent || 0}%</span>
        </div>
        <ProgressBar value={data?.collectionPercent || 0} max={100} color={Number(data?.collectionPercent || 0) >= 80 ? "success" : Number(data?.collectionPercent || 0) >= 50 ? "brand" : "warning"} />
        <div className="text-xs text-slate-500 mt-2">{formatINR(data?.collected || 0)} collected out of {formatINR(data?.expected || 0)} expected.</div>
      </Card>

      <Card className="overflow-hidden w-full min-w-0">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
          Payments — {data?.label}
        </div>
        {filteredPayments.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No payments" description="No payments for this month / filter." icon={Wallet} />
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Course / Batch</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-brand-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.studentName} size="sm" />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{p.studentName}</div>
                            <div className="text-xs text-slate-400 font-mono">{p.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="purple">{p.studentCourse}</Badge>
                          <Badge variant="muted">{p.studentBatch}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">{formatINR(p.amount)}</td>
                      <td className="px-4 py-4">
                        <Badge variant={p.method === "Cash" ? "success" : p.method === "UPI" ? "primary" : p.method === "Bank Transfer" ? "purple" : p.method === "Card" ? "info" : "muted"}>{p.method}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(p.date)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{p.receiptNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lg:hidden grid gap-3 p-3">
              {filteredPayments.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:shadow-card transition-shadow duration-200 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={p.studentName} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{p.studentName}</div>
                        <div className="text-xs font-mono text-slate-500 truncate">{p.studentId}</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900 shrink-0">{formatINR(p.amount)}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={p.method === "Cash" ? "success" : p.method === "UPI" ? "primary" : "purple"}>{p.method}</Badge>
                    <Badge variant="purple">{p.studentCourse}</Badge>
                    <Badge variant="muted">{p.studentBatch}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Date {formatDate(p.date)} · {p.receiptNumber}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
