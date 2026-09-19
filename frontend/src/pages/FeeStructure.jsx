import { useEffect, useState } from "react";
import { Plus, IndianRupee, CalendarDays, Clock, Award, Trash2, Sparkles, BookOpen } from "lucide-react";
import { api, formatINR } from "../api/client.js";
import { Card, Button, Input, Label, Select, Modal, PageHeader, LoadingState, EmptyState, Badge } from "../components/ui.jsx";

export default function FeeStructure() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ course: "Class 10", monthlyFee: "2000", quarterlyFee: "5500", halfYearlyFee: "10500", yearlyFee: "20000", admissionFee: "1000", description: "" });

  const load = () => { api("/api/fees/plans").then((r) => setPlans(r.plans || [])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    await api("/api/fees/plans", { method: "POST", body: { ...form, monthlyFee: Number(form.monthlyFee), quarterlyFee: Number(form.quarterlyFee), halfYearlyFee: Number(form.halfYearlyFee), yearlyFee: Number(form.yearlyFee), admissionFee: Number(form.admissionFee) } });
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this fee plan?")) return;
    await api(`/api/fees/plans/${id}`, { method: "DELETE" });
    load();
  };

  const cardThemes = [
    { accent: "from-brand-500 to-brand-600", bg: "bg-brand-50", border: "border-brand-200", text: "text-brand-700", ring: "ring-brand-100", icon: "text-brand-500" },
    { accent: "from-purple-500 to-purple-600", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", ring: "ring-purple-100", icon: "text-purple-500" },
    { accent: "from-info-500 to-info-600", bg: "bg-info-50", border: "border-info-200", text: "text-info-700", ring: "ring-info-100", icon: "text-info-500" },
    { accent: "from-success-500 to-success-600", bg: "bg-success-50", border: "border-success-200", text: "text-success-700", ring: "ring-success-100", icon: "text-success-500" },
  ];

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Courses & Fee Structure"
        subtitle="Define course-wise fee slabs. Used when creating students."
        action={
          <Button variant="primary" onClick={() => setOpen(true)} className="w-full sm:w-auto shadow-lg shadow-brand-500/25">
            <Plus className="w-4 h-4 mr-2" />Add Course
          </Button>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          title="No courses"
          description="Add a course with fee plans to get started."
          icon={BookOpen}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full min-w-0">
          {plans.map((p, idx) => {
            const theme = cardThemes[idx % cardThemes.length];
            return (
              <Card key={p.id} className="p-0 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full min-w-0 overflow-hidden ring-1 ring-slate-200 hover:ring-slate-300 border-0">
                <div className={`h-2 bg-gradient-to-r ${theme.accent}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-bold text-slate-900 truncate">{p.course}</div>
                      <div className="text-xs text-slate-500 mt-1">Fee plan</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id)} className="text-slate-400 hover:text-danger-500 hover:bg-danger-50 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`p-3 rounded-xl ${theme.bg} ${theme.border} border`}>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3" />
                        Monthly
                      </div>
                      <div className={`text-sm font-bold font-mono ${theme.text}`}>{formatINR(p.monthlyFee)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                        <CalendarDays className="w-3 h-3" />
                        Quarterly
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-700">{formatINR(p.quarterlyFee)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                        <Award className="w-3 h-3" />
                        Half-yearly
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-700">{formatINR(p.halfYearlyFee)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                      <div className="text-[11px] text-white/60 flex items-center gap-1 mb-0.5">
                        <Sparkles className="w-3 h-3" />
                        Yearly
                      </div>
                      <div className="text-sm font-bold font-mono">{formatINR(p.yearlyFee)}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <IndianRupee className="w-3 h-3" />
                      Admission: {formatINR(p.admissionFee)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Course" width="max-w-lg">
        <form onSubmit={create} className="space-y-4 w-full min-w-0">
          <div className="min-w-0">
            <Label>Course</Label>
            <Select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
              <option>Nursery</option><option>LKG</option><option>UKG</option>
              <option>Class 1</option><option>Class 2</option><option>Class 3</option><option>Class 4</option><option>Class 5</option>
              <option>Class 6</option><option>Class 7</option><option>Class 8</option><option>Class 9</option><option>Class 10</option>
              <option>Class 11</option><option>Class 12</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
            <div className="min-w-0">
              <Label>Monthly</Label>
              <Input type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} />
            </div>
            <div className="min-w-0">
              <Label>Quarterly</Label>
              <Input type="number" value={form.quarterlyFee} onChange={(e) => setForm({ ...form, quarterlyFee: e.target.value })} />
            </div>
            <div className="min-w-0">
              <Label>Half-yearly</Label>
              <Input type="number" value={form.halfYearlyFee} onChange={(e) => setForm({ ...form, halfYearlyFee: e.target.value })} />
            </div>
            <div className="min-w-0">
              <Label>Yearly</Label>
              <Input type="number" value={form.yearlyFee} onChange={(e) => setForm({ ...form, yearlyFee: e.target.value })} />
            </div>
            <div className="min-w-0">
              <Label>Admission</Label>
              <Input type="number" value={form.admissionFee} onChange={(e) => setForm({ ...form, admissionFee: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 w-full">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto shadow-lg shadow-brand-500/25">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Add Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
