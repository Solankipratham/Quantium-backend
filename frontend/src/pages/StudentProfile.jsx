import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, CreditCard, MessageCircle, FileDown, Send, Calendar, Phone, BookOpen, GraduationCap, User, AlertTriangle } from "lucide-react";
import { api, formatINR, formatDate } from "../api/client.js";
import { Card, Button, LoadingState, EmptyState, Badge, Input, Select, Label, Textarea, Modal, PageHeader, Avatar, ProgressBar, Tabs, StatCard } from "../components/ui.jsx";
import FeeStatusBadge from "../components/FeeStatusBadge.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import Receipt from "../components/Receipt.jsx";
import { downloadStudentPDF } from "../utils/pdf.js";

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api(`/api/students/${id}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  useEffect(() => {
    if (data?.student) setEditForm({ ...data.student, dob: data.student.dob ? String(data.student.dob).slice(0, 10) : "", joiningDate: data.student.joiningDate ? String(data.student.joiningDate).slice(0, 10) : "", firstDueDate: data.student.firstDueDate ? String(data.student.firstDueDate).slice(0, 10) : "" });
  }, [data]);

  if (loading) return <LoadingState label="Loading student profile..." />;
  if (!data) return <EmptyState icon={GraduationCap} title="Student not found" description="The student may have been removed." />;
  const s = data.student;
  const payments = data.payments || [];
  const percent = s.finalFee ? Math.round((s.paid / s.finalFee) * 100) : 0;

  const onPaymentSuccess = async (r) => {
    load();
    try {
      const rec = await api(`/api/payments/${r.payment.id}`);
      setReceipt(rec);
    } catch {}
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await api(`/api/students/${id}`, { method: "PUT", body: editForm });
    setEditOpen(false);
    load();
  };

  const remove = async () => {
    setDeleteLoading(true);
    try {
      await api(`/api/students/${id}`, { method: "DELETE" });
      setDeleteOpen(false);
      navigate("/admin/students");
    } catch (e) {
      setDeleteLoading(false);
    }
  };

  const reminderText = `Hello, this is a reminder from Quantum Coaching regarding the pending fee of ${formatINR(s.pending)} for ${s.name} (${s.studentId}). Next due: ${formatDate(s.nextDueDate)}. Please complete the payment at your earliest convenience.`;

  const downloadPDF = async () => {
    const coaching = await api("/api/settings").then((r) => r.settings?.coaching).catch(() => null);
    downloadStudentPDF(s, payments, s.monthlyRecords, coaching);
  };

  const monthlyRecords = (s.monthlyRecords || []).slice(-8);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 overflow-x-hidden">
      <Link to="/admin/students" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors min-h-[44px]">
        <ArrowLeft className="w-4 h-4" />Back to students
      </Link>

      {/* Hero Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-purple-600 px-6 py-8 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar name={s.name} size="xl" className="ring-4 ring-white/30" />
            <div className="min-w-0 flex-1 text-white">
              <div className="text-2xl sm:text-3xl font-bold truncate">{s.name}</div>
              <div className="text-sm text-white/80 font-mono mt-1">{s.studentId}</div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm">
                  <BookOpen className="w-3 h-3 mr-1.5" />{s.course}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm">
                  <Calendar className="w-3 h-3 mr-1.5" />{s.batch}
                </span>
                <FeeStatusBadge status={s.status} />
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 sm:px-8 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button variant="ghost" onClick={downloadPDF} className="w-full sm:w-auto"><FileDown className="w-4 h-4 mr-2" />Download PDF</Button>
          <Button variant="secondary" onClick={() => setEditOpen(true)} className="w-full sm:w-auto"><Pencil className="w-4 h-4 mr-2" />Edit</Button>
          <Button onClick={() => setPayOpen(true)} className="w-full sm:w-auto"><CreditCard className="w-4 h-4 mr-2" />Record Payment</Button>
          <Button variant="danger-outline" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto"><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full min-w-0">
        <Card className="p-5 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Fee</div>
          <div className="text-2xl font-bold text-slate-900">{formatINR(s.finalFee)}</div>
          {Number(s.discount) ? <div className="text-xs text-slate-400 mt-1">Discount {formatINR(s.discount)} · Original {formatINR(s.totalFee)}</div> : null}
        </Card>
        <Card className="p-5 min-w-0 border-success-200 bg-success-50/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-success-600 mb-1">Paid</div>
          <div className="text-2xl font-bold text-success-700">{formatINR(s.paid)}</div>
          <div className="text-xs text-success-600 mt-1">{percent}% complete</div>
        </Card>
        <Card className="p-5 min-w-0 border-warning-200 bg-warning-50/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-warning-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-warning-700">{formatINR(s.pending)}</div>
          <div className="text-xs text-slate-500 mt-1">Next due {formatDate(s.nextDueDate)}</div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="p-5 w-full min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3 min-w-0">
          <div className="text-sm font-semibold text-slate-900">Payment Progress</div>
          <div className="text-xs text-slate-500 truncate">{formatINR(s.paid)} / {formatINR(s.finalFee)} Paid · {percent}%</div>
        </div>
        <ProgressBar value={s.paid} max={s.finalFee} color={percent >= 100 ? "success" : percent >= 50 ? "brand" : "warning"} />
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "payments", label: "Payments", count: payments.length },
          { value: "monthly", label: "Monthly Fees" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 grid place-items-center">
                <User className="w-4.5 h-4.5" />
              </div>
              <div className="text-sm font-semibold text-slate-900">Personal Information</div>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Full Name</span><span className="font-medium text-slate-900">{s.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Student ID</span><span className="font-mono text-slate-700">{s.studentId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-mono text-slate-700">{s.phone}</span></div>
              {s.parentPhone ? <div className="flex justify-between"><span className="text-slate-500">Parent Phone</span><span className="font-mono text-slate-700">{s.parentPhone}</span></div> : null}
              {s.parentName ? <div className="flex justify-between"><span className="text-slate-500">Parent</span><span className="font-medium text-slate-700">{s.parentName}</span></div> : null}
              {s.email ? <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-slate-700">{s.email}</span></div> : null}
              {s.address ? <div className="flex flex-col gap-1"><span className="text-slate-500">Address</span><span className="text-slate-700 text-right">{s.address}</span></div> : null}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 grid place-items-center">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <div className="text-sm font-semibold text-slate-900">Academic Information</div>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Course</span><span className="font-medium text-slate-900">{s.course}</span></div>
              {s.subject ? <div className="flex justify-between"><span className="text-slate-500">Subject</span><span className="font-medium text-slate-700">{s.subject}</span></div> : null}
              <div className="flex justify-between"><span className="text-slate-500">Batch</span><span className="font-medium text-slate-900">{s.batch}</span></div>
              {s.teacher ? <div className="flex justify-between"><span className="text-slate-500">Teacher</span><span className="font-medium text-slate-700">{s.teacher}</span></div> : null}
              <div className="flex justify-between"><span className="text-slate-500">Joining Date</span><span className="text-slate-700">{formatDate(s.joiningDate)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><FeeStatusBadge status={s.status} /></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "payments" && (
        <Card className="overflow-hidden w-full min-w-0">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
            <div className="text-sm font-semibold text-slate-900">Payment History</div>
            <span className="text-xs text-slate-500">{payments.length} payments</span>
          </div>
          {payments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={CreditCard}
                title="No payments yet"
                description="Record the first payment for this student."
                action={<Button onClick={() => setPayOpen(true)}><CreditCard className="w-4 h-4 mr-2" />Record Payment</Button>}
              />
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto w-full">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Receipt</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">For</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors duration-150">
                        <td className="px-5 py-3.5 text-sm text-slate-700">{formatDate(p.date)}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{p.receiptNumber}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">{formatINR(p.amount)}</td>
                        <td className="px-4 py-3.5"><Badge variant="primary">{p.method}</Badge></td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">{p.paymentFor}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 break-words max-w-[200px]">{p.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden grid gap-3 p-3">
                {payments.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:shadow-card transition-shadow duration-200 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900">{formatINR(p.amount)}</div>
                        <div className="text-xs font-mono text-slate-500 truncate">{p.receiptNumber}</div>
                      </div>
                      <Badge variant="primary">{p.method}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-2.5">Date {formatDate(p.date)} · For {p.paymentFor || "—"}</div>
                    {p.notes ? <div className="text-xs text-slate-400 mt-1.5 break-words">{p.notes}</div> : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {activeTab === "monthly" && (
        <Card className="overflow-hidden w-full min-w-0">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
            <div className="text-sm font-semibold text-slate-900">Monthly Fee Schedule</div>
            <span className="text-xs text-slate-500">5-day Due Soon warning · Due date {s.monthlyDueDate || 10}th</span>
          </div>
          <div className="hidden lg:block overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Month</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Due Date</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Fee</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Paid</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Remaining</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRecords.map((r) => {
                  const statusVariant = r.status === "Paid" ? "success" : r.status === "Partially Paid" ? "info" : r.status === "Due Soon" || r.status === "Due Today" ? "warning" : r.status === "Overdue" ? "danger" : "default";
                  return (
                    <tr key={r.monthKey} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors duration-150">
                      <td className="px-5 py-3 text-sm font-medium text-slate-900">{r.label}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(r.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{formatINR(r.monthlyFee)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-success-600">{formatINR(r.paid)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900">{formatINR(r.remaining)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant}>
                          {r.status}{r.status === "Due Soon" ? ` · ${r.daysRemaining}d` : ""}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden grid gap-3 p-3">
            {monthlyRecords.map((r) => {
              const statusVariant = r.status === "Paid" ? "success" : r.status === "Partially Paid" ? "info" : r.status === "Due Soon" || r.status === "Due Today" ? "warning" : r.status === "Overdue" ? "danger" : "default";
              return (
                <div key={r.monthKey} className="p-3.5 rounded-xl border border-slate-100 bg-white flex flex-col gap-2 min-w-0 hover:shadow-card transition-shadow duration-200">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{r.label}</div>
                    <Badge variant={statusVariant} className="shrink-0">
                      {r.status}{r.status === "Due Soon" ? ` · ${r.daysRemaining}d` : ""}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">Due {formatDate(r.dueDate)}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                      <div className="text-[11px] text-slate-400">Fee</div>
                      <div className="font-mono font-semibold text-slate-700">{formatINR(r.monthlyFee)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-success-50 border border-success-100 text-center">
                      <div className="text-[11px] text-success-600">Paid</div>
                      <div className="font-mono font-semibold text-success-700">{formatINR(r.paid)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-warning-50 border border-warning-100 text-center">
                      <div className="text-[11px] text-warning-600">Remaining</div>
                      <div className="font-mono font-bold text-warning-700">{formatINR(r.remaining)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {receipt ? (
        <Card className="p-5 w-full min-w-0 overflow-hidden">
          <div className="text-sm font-semibold text-slate-900 mb-3">Latest Receipt</div>
          <Receipt payment={receipt.payment} student={receipt.student} previousPaid={receipt.previousPaid} pendingBefore={receipt.pending} pendingAfter={receipt.afterPayment?.pending} coaching={receipt.coaching} />
          <Button variant="ghost" onClick={() => setReceipt(null)} className="mt-3 w-full sm:w-auto">Dismiss</Button>
        </Card>
      ) : null}

      {/* Send Reminder */}
      <Card className="overflow-hidden w-full min-w-0">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-info-100 text-info-600 grid place-items-center">
            <Send className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Send Reminder</div>
            <div className="text-xs text-slate-500">Send a fee reminder via WhatsApp</div>
          </div>
        </div>
        <div className="p-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 break-words min-w-0">{reminderText}</div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(reminderText)} className="w-full sm:w-auto"><MessageCircle className="w-4 h-4 mr-2" />Copy Message</Button>
            <a href={`https://wa.me/${String(s.parentPhone || s.phone).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(reminderText)}`} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
              <Button className="w-full"><MessageCircle className="w-4 h-4 mr-2" />Open WhatsApp</Button>
            </a>
          </div>
        </div>
      </Card>

      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} student={s} onSuccess={onPaymentSuccess} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit — ${s.name}`} width="max-w-2xl">
        {editForm ? (
          <form onSubmit={saveEdit} className="space-y-4 w-full min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
              <div className="min-w-0"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div className="min-w-0"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div className="min-w-0"><Label>Parent</Label><Input value={editForm.parentName} onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })} /></div>
              <div className="min-w-0"><Label>Parent Phone</Label><Input value={editForm.parentPhone} onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })} /></div>
              <div className="min-w-0"><Label>Course</Label><Select value={editForm.course} onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}><option>Nursery</option><option>LKG</option><option>UKG</option><option>Class 1</option><option>Class 2</option><option>Class 3</option><option>Class 4</option><option>Class 5</option><option>Class 6</option><option>Class 7</option><option>Class 8</option><option>Class 9</option><option>Class 10</option><option>Class 11</option><option>Class 12</option></Select></div>
              <div className="min-w-0"><Label>Batch</Label><Select value={editForm.batch} onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}><option>Morning</option><option>Evening</option></Select></div>
              <div className="min-w-0"><Label>Total Fee</Label><Input type="number" value={editForm.totalFee} onChange={(e) => setEditForm({ ...editForm, totalFee: e.target.value })} /></div>
              <div className="min-w-0"><Label>Discount</Label><Input type="number" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })} /></div>
              <div className="min-w-0"><Label>Monthly Fee</Label><Input type="number" value={editForm.monthlyFee} onChange={(e) => setEditForm({ ...editForm, monthlyFee: e.target.value })} /></div>
              <div className="min-w-0"><Label>Status</Label><Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option>Active</option><option>Inactive</option></Select></div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 w-full">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Student" width="max-w-md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning-50 border border-warning-200">
            <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-warning-700">Student will be moved to Recycle Bin</div>
              <div className="text-xs text-warning-600 mt-1">You can restore the student later from the Recycle Bin if needed.</div>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-semibold text-slate-900">{s.name}</span> ({s.studentId})?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="danger" onClick={remove} disabled={deleteLoading}>
              <Trash2 className="w-4 h-4 mr-2" />{deleteLoading ? "Deleting..." : "Delete Student"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
