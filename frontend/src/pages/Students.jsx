import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Trash2, Eye, CreditCard, FileDown, Users, UserCheck, UserX, Clock } from "lucide-react";
import { api, formatINR, formatDate } from "../api/client.js";
import { Card, Button, Input, Select, EmptyState, LoadingState, PageHeader, StatCard, Avatar, Badge } from "../components/ui.jsx";
import FeeStatusBadge from "../components/FeeStatusBadge.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import { downloadStudentPDF } from "../utils/pdf.js";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [batch, setBatch] = useState("all");
  const [course, setCourse] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [payFor, setPayFor] = useState(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, batch, course, feeStatus: status });
    if (q) params.set("search", q);
    api(`/api/students?${params.toString()}`).then((r) => {
      setStudents(r.students || []);
    }).catch(() => {}).finally(() => setLoading(false));
    api("/api/students/filters").then((r) => {
      setBatches(r.batches || []);
      setCourses(r.courses || []);
    }).catch((error) => {
      console.error("Failed to load student filters:", error);
      setBatches([]);
      setCourses([]);
    });
  };

  useEffect(load, []); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q, batch, course, status, sort]); // eslint-disable-line

  const removeStudent = async (s) => {
    if (!confirm(`Delete ${s.name}? This will also remove all payments.`)) return;
    await api(`/api/students/${s.id}`, { method: "DELETE" });
    load();
  };

  const downloadPDF = async (s) => {
    try {
      const full = await api(`/api/students/${s.id}`);
      const coaching = await api("/api/settings").then((r) => r.settings?.coaching).catch(() => null);
      downloadStudentPDF(full.student, full.payments, full.student.monthlyRecords, coaching);
    } catch (e) { alert(e.message); }
  };

  const totalFee = students.reduce((sum, s) => sum + Number(s.finalFee || 0), 0);
  const totalPaid = students.reduce((sum, s) => sum + Number(s.paid || 0), 0);
  const totalPending = students.reduce((sum, s) => sum + Number(s.pending || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle={`${students.length} students · Search, filter, and manage fees in seconds.`}
        action={
          <Link to="/students/new">
            <Button><Plus className="w-4 h-4 mr-2" />Add Student</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} color="brand" subtitle={`${courses.length} courses · ${batches.length} batches`} />
        <StatCard title="Total Paid" value={formatINR(totalPaid)} icon={UserCheck} color="success" subtitle={`${students.filter((s) => s.status === "PAID").length} fully paid`} />
        <StatCard title="Pending" value={formatINR(totalPending)} icon={Clock} color="warning" subtitle={`${students.filter((s) => s.status === "PENDING" || s.status === "PARTIAL").length} with dues`} />
        <StatCard title="Overdue" value={students.filter((s) => s.status === "OVERDUE").length} icon={UserX} color="danger" subtitle="Needs attention" />
      </div>

      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID, phone, email..." icon={Search} />
          </div>
          <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value="all">All batches</option>
            {batches.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value="all">All courses</option>
            {courses.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All fee statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </Select>
        </div>
        <div className="mt-3">
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="max-w-xs">
            <option value="name">Sort: Name A–Z</option>
            <option value="highestPending">Highest pending</option>
            <option value="lowestPending">Lowest pending</option>
            <option value="recentPayment">Recent payment</option>
            <option value="oldestDue">Oldest due</option>
            <option value="newest">Newest student</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <LoadingState label="Loading students..." />
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Add your first student to start managing fees."
          action={<Link to="/students/new"><Button><Plus className="w-4 h-4 mr-2" />Add Student</Button></Link>}
        />
      ) : (
        <>
          {/* desktop table */}
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Batch</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Fee</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Paid</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Next Due</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors duration-150">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{s.studentId} · {s.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm text-slate-700">{s.batch || "—"}</div>
                        <div className="text-xs text-slate-400">{s.course}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-700">{formatINR(s.finalFee)}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-success-600 font-medium">{formatINR(s.paid)}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">{formatINR(s.pending)}</td>
                      <td className="px-4 py-3.5 text-sm">
                        <div className="text-slate-700">{formatDate(s.nextDueDate)}</div>
                        {s.daysOverdue ? <div className="text-xs text-danger-500 font-medium">{s.daysOverdue}d overdue</div> : null}
                      </td>
                      <td className="px-4 py-3.5"><FeeStatusBadge status={s.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <Link to={`/students/${s.id}`} className="w-8 h-8 grid place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all duration-150">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => setPayFor(s)} className="w-8 h-8 grid place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-success-50 hover:text-success-600 hover:border-success-200 transition-all duration-150">
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => downloadPDF(s)} className="w-8 h-8 grid place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-info-50 hover:text-info-600 hover:border-info-200 transition-all duration-150" title="Download PDF">
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeStudent(s)} className="w-8 h-8 grid place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 transition-all duration-150">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* mobile cards */}
          <div className="lg:hidden grid gap-3">
            {students.map((s) => (
              <Card key={s.id} className="p-4 hover:shadow-card-hover transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={s.name} size="md" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{s.studentId} · {s.batch}</div>
                    </div>
                  </div>
                  <FeeStatusBadge status={s.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[11px] text-slate-400 uppercase font-medium">Fee</div>
                    <div className="font-mono font-semibold text-slate-900">{formatINR(s.finalFee)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-success-50 border border-success-100">
                    <div className="text-[11px] text-success-600 uppercase font-medium">Paid</div>
                    <div className="font-mono font-semibold text-success-700">{formatINR(s.paid)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-warning-50 border border-warning-100">
                    <div className="text-[11px] text-warning-600 uppercase font-medium">Pending</div>
                    <div className="font-mono font-semibold text-warning-700">{formatINR(s.pending)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link to={`/students/${s.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full text-xs"><Eye className="w-3.5 h-3.5 mr-1.5" />View</Button>
                  </Link>
                  <Button className="flex-1 text-xs" onClick={() => setPayFor(s)}><CreditCard className="w-3.5 h-3.5 mr-1.5" />Record Payment</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <PaymentModal open={!!payFor} onClose={() => setPayFor(null)} student={payFor} onSuccess={load} />
    </div>
  );
}
