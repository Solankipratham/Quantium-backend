import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Button, Input, Select, Label, Textarea, Modal, Avatar } from "./ui.jsx";
import { Calendar, FileText, IndianRupee } from "lucide-react";

const METHODS = ["Cash", "UPI", "Bank Transfer", "Card", "Other"];
const METHOD_ICONS = { Cash: "💵", UPI: "📱", "Bank Transfer": "🏦", Card: "💳", Other: "📋" };

export default function PaymentModal({ open, onClose, student, onSuccess }) {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: "", amount: "", date: new Date().toISOString().slice(0, 10), method: "Cash", paymentFor: "", receiptNumber: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (student) setForm((f) => ({ ...f, studentId: student.id, amount: String(student.monthlyFee || "") }));
    else setForm((f) => ({ ...f, studentId: "" }));
    if (!student) {
      api("/api/students").then((r) => setStudents(r.students || [])).catch(() => {});
    }
  }, [open, student]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        studentId: form.studentId,
        amount: Number(form.amount),
        date: form.date,
        method: form.method,
        paymentFor: form.paymentFor || undefined,
        receiptNumber: form.receiptNumber || undefined,
        notes: form.notes || undefined
      };
      const r = await api("/api/payments", { method: "POST", body: payload });
      onSuccess?.(r);
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to record payment.");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-lg">
      <div className="-m-5 sm:-m-6 mb-0">
        <div className="relative bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500 px-5 sm:px-6 pt-5 sm:pt-6 pb-8 sm:pb-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzRtMC04djItSDJ2LTJoMzRtMC04djItSDJ2LTJoMzQiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-white/80 text-xs font-semibold tracking-widest uppercase mb-1">Record Payment</div>
              <div className="text-white text-lg sm:text-xl font-bold">{student ? `Pay for ${student.name}` : "New Payment"}</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="-mt-4 mx-5 sm:mx-6">
          {student ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
              <div className="flex items-center gap-3">
                <Avatar name={student.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 truncate">{student.name}</div>
                  <div className="text-xs text-slate-500 truncate">{student.studentId} · {student.batch}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Pending</div>
                  <div className="text-lg font-bold text-danger-600">₹{(Number(student.pending) || 0).toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 pt-5 w-full min-w-0 overflow-hidden">
        {!student ? (
          <div className="min-w-0">
            <Label>Student *</Label>
            <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.studentId} · {s.batch}</option>)}
            </Select>
          </div>
        ) : null}

        <div className="min-w-0">
          <Label>Amount *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-brand-500">₹</span>
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              placeholder="5000"
              className="w-full h-14 pl-10 pr-4 rounded-2xl border-2 border-brand-200 bg-brand-50/50 text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        <div className="min-w-0">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-5 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, method: m })}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center ${
                  form.method === m
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{METHOD_ICONS[m]}</span>
                <span className={`text-[10px] font-semibold leading-tight ${form.method === m ? "text-brand-700" : "text-slate-500"}`}>{m}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
          <div className="min-w-0">
            <Label>Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="!pl-10" />
            </div>
          </div>
          <div className="min-w-0">
            <Label>For (month)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input value={form.paymentFor} onChange={(e) => setForm({ ...form, paymentFor: e.target.value })} placeholder="September Fee" className="!pl-10" />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <Label>Receipt Number</Label>
          <Input value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} placeholder="Auto-generates if blank" />
        </div>

        <div className="min-w-0">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-xl p-3.5 break-words w-full min-w-0 overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-danger-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-danger-600 text-xs font-bold">!</span>
            </div>
            {error}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2 w-full">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button type="submit" variant="success" size="lg" disabled={saving} loading={saving} className="w-full sm:w-auto">
            {saving ? null : <IndianRupee className="w-4 h-4" />}
            {saving ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
