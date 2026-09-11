import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { Card, Button, Input, Select, Label, Textarea, PageHeader } from "../components/ui.jsx";
import { User, BookOpen, Wallet, ArrowLeft } from "lucide-react";

export default function AddStudent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", studentId: "", dob: "", gender: "", phone: "", parentName: "", parentPhone: "", email: "", address: "", photo: "",
    course: "Class 10", subject: "", batch: "Class 10 — Evening", joiningDate: new Date().toISOString().slice(0, 10), teacher: "",
    totalFee: "24000", monthlyFee: "2000", admissionFee: "1000", discount: "0", paymentPlan: "Monthly", firstDueDate: "", monthlyDueDate: "10"
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await api("/api/students", { method: "POST", body: form });
      navigate(`/students/${r.student.id}`);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full min-w-0 px-0">
      <PageHeader
        title="Add Student"
        subtitle="Create a new student record. Student ID auto-generates if left blank."
        action={
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
        }
      />

      <form onSubmit={submit} className="space-y-6 w-full min-w-0">
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 grid place-items-center">
              <User className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Personal Information</div>
              <div className="text-xs text-slate-500">Student contact and identity details</div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0"><Input label="Full Name *" value={form.name} onChange={set("name")} required placeholder="Rahul Sharma" icon={User} /></div>
              <div className="min-w-0"><Input label="Student ID (optional)" value={form.studentId} onChange={set("studentId")} placeholder="QTM-2026-001" /></div>
              <div className="min-w-0"><Input label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} /></div>
              <div className="min-w-0"><Select label="Gender" value={form.gender} onChange={set("gender")}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></Select></div>
              <div className="min-w-0"><Input label="Student Phone *" value={form.phone} onChange={set("phone")} required placeholder="9812345670" /></div>
              <div className="min-w-0"><Input label="Parent / Guardian Name" value={form.parentName} onChange={set("parentName")} placeholder="Rajesh Sharma" /></div>
              <div className="min-w-0"><Input label="Parent Phone" value={form.parentPhone} onChange={set("parentPhone")} placeholder="9812345671" /></div>
              <div className="min-w-0"><Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="rahul@gmail.com" /></div>
              <div className="min-w-0 sm:col-span-2"><Input label="Student Photo URL (optional)" value={form.photo} onChange={set("photo")} placeholder="https://.../photo.jpg" /></div>
              <div className="sm:col-span-2 min-w-0"><Textarea label="Address" value={form.address} onChange={set("address")} placeholder="Full address" /></div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 grid place-items-center">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Academic Information</div>
              <div className="text-xs text-slate-500">Course, batch, and enrollment details</div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0"><Select label="Course *" value={form.course} onChange={set("course")}><option>Class 9</option><option>Class 10</option><option>Class 11</option><option>Class 12</option></Select></div>
              <div className="min-w-0"><Input label="Subject" value={form.subject} onChange={set("subject")} placeholder="Mathematics & Science" /></div>
              <div className="min-w-0"><Select label="Batch *" value={form.batch} onChange={set("batch")}><option>Class 10 — Morning</option><option>Class 10 — Evening</option><option>Class 11 — Morning</option><option>Class 11 — Evening</option><option>Class 12 — Morning</option><option>Class 12 — Evening</option></Select></div>
              <div className="min-w-0"><Input label="Teacher" value={form.teacher} onChange={set("teacher")} placeholder="Mr. Rajesh Iyer" /></div>
              <div className="min-w-0 sm:col-span-2"><Input label="Joining Date" type="date" value={form.joiningDate} onChange={set("joiningDate")} /></div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success-100 text-success-600 grid place-items-center">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Fee Information</div>
              <div className="text-xs text-slate-500">Course fee and payment plan setup</div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0"><Input label="Total Course Fee *" type="number" value={form.totalFee} onChange={set("totalFee")} required /></div>
              <div className="min-w-0"><Input label="Monthly Fee" type="number" value={form.monthlyFee} onChange={set("monthlyFee")} /></div>
              <div className="min-w-0"><Input label="Admission Fee" type="number" value={form.admissionFee} onChange={set("admissionFee")} /></div>
              <div className="min-w-0"><Input label="Discount" type="number" value={form.discount} onChange={set("discount")} /></div>
              <div className="min-w-0"><Select label="Payment Plan" value={form.paymentPlan} onChange={set("paymentPlan")}><option>Monthly</option><option>Quarterly</option><option>Half-Yearly</option><option>Yearly</option><option>Full Course</option></Select></div>
              <div className="min-w-0"><Input label="First Due Date" type="date" value={form.firstDueDate} onChange={set("firstDueDate")} /></div>
              <div className="min-w-0 sm:col-span-2"><Input label="Monthly Due Date (1–31)" type="number" min="1" max="31" value={form.monthlyDueDate} onChange={set("monthlyDueDate")} /></div>
            </div>
          </div>
        </Card>

        {error ? (
          <div className="rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm p-4 break-words flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-danger-100 grid place-items-center shrink-0 mt-0.5">
              <span className="text-danger-600 text-xs font-bold">!</span>
            </div>
            {error}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
          <Button type="submit" variant="success" disabled={saving} loading={saving} className="w-full sm:w-auto order-1 sm:order-2">
            {saving ? "Creating..." : "Create Student"}
          </Button>
        </div>
      </form>
    </div>
  );
}
