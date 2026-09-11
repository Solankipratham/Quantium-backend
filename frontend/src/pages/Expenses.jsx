import { useEffect, useState } from "react";
import { api, formatINR, formatDate } from "../api/client.js";
import { Card, Button, Input, Select, Label, Textarea, Modal, PageHeader, LoadingState, EmptyState, StatCard } from "../components/ui.jsx";
import { Plus, Trash2, Wallet, Tag, Calendar, CreditCard, StickyNote, Receipt } from "lucide-react";

const CATS = ["Rent", "Electricity", "Teacher Salary", "Marketing", "Stationery", "Internet", "Maintenance", "Other"];

const catColors = {
  Rent: "bg-brand-100 text-brand-600",
  Electricity: "bg-warning-100 text-warning-600",
  "Teacher Salary": "bg-success-100 text-success-600",
  Marketing: "bg-purple-100 text-purple-600",
  Stationery: "bg-info-100 text-info-600",
  Internet: "bg-info-100 text-info-600",
  Maintenance: "bg-danger-100 text-danger-600",
  Other: "bg-slate-100 text-slate-600",
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "Rent", description: "", amount: "", date: new Date().toISOString().slice(0, 10), method: "Cash", notes: "" });
  const [cat, setCat] = useState("all");

  const load = () => {
    setLoading(true);
    const qs = cat !== "all" ? `?category=${cat}` : "";
    api(`/api/expenses${qs}`).then((r) => { setExpenses(r.expenses || []); setTotal(r.total || 0); setByCategory(r.byCategory || {}); }).finally(() => setLoading(false));
  };
  useEffect(load, [cat]);

  const create = async (e) => {
    e.preventDefault();
    await api("/api/expenses", { method: "POST", body: { ...form, amount: Number(form.amount) } });
    setOpen(false);
    setForm({ category: "Rent", description: "", amount: "", date: new Date().toISOString().slice(0, 10), method: "Cash", notes: "" });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this expense?")) return;
    await api(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Expenses"
        subtitle={`Total ${formatINR(total)} · Track and manage all expenses.`}
        action={
          <>
            <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full sm:w-[160px]">
              <option value="all">All categories</option>
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Button onClick={() => setOpen(true)} className="w-full sm:w-auto" icon={Plus}>Add Expense</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <StatCard title="Total Expenses" value={formatINR(total)} icon={Wallet} color="danger" subtitle={`${expenses.length} records`} />
        {Object.entries(byCategory).map(([k, v]) => (
          <Card key={k} className="p-5 hover:shadow-card-hover transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${catColors[k] || "bg-slate-100 text-slate-600"}`}>
                {k[0]}
              </div>
              <div className="text-xs text-slate-500 font-medium truncate">{k}</div>
            </div>
            <div className="text-xl font-bold text-slate-900 truncate">{formatINR(v)}</div>
          </Card>
        ))}
      </div>

      {loading ? <LoadingState /> : expenses.length === 0 ? (
        <EmptyState title="No expenses" description="Track rent, salaries, and other costs here." icon={Receipt} />
      ) : (
        <>
          <Card className="hidden lg:block overflow-x-auto w-full min-w-0 p-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-slate-600">{formatDate(e.date)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${catColors[e.category] || "bg-slate-100 text-slate-600"}`}>
                        <Tag className="w-3 h-3" />{e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs break-words max-w-[220px] text-slate-600">{e.description || "—"}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-danger-600">{formatINR(e.amount)}</td>
                    <td className="px-4 py-3.5 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        <CreditCard className="w-3 h-3" />{e.method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button size="sm" variant="danger-outline" onClick={() => remove(e.id)} icon={Trash2}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="lg:hidden grid gap-3 w-full min-w-0">
            {expenses.map((e) => (
              <Card key={e.id} className="p-4 w-full min-w-0 overflow-hidden border-l-4 border-l-danger-400">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${catColors[e.category] || "bg-slate-100 text-slate-600"}`}>
                        {e.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />{formatDate(e.date)}
                      <span className="text-slate-300">·</span>
                      <CreditCard className="w-3 h-3" />{e.method}
                    </div>
                  </div>
                  <div className="text-lg font-bold font-mono text-danger-600 shrink-0">{formatINR(e.amount)}</div>
                </div>
                {e.description ? <div className="text-xs text-slate-600 mt-2 break-words">{e.description}</div> : null}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <Button size="sm" variant="danger-outline" onClick={() => remove(e.id)} icon={Trash2} className="w-full">Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Expense" width="max-w-lg">
        <form onSubmit={create} className="space-y-4 w-full min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
            <div className="min-w-0">
              <Label>Category *</Label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="min-w-0">
              <Label>Amount *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" />
            </div>
          </div>
          <div className="min-w-0">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this for?" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
            <div className="min-w-0">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="min-w-0">
              <Label>Method</Label>
              <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Other</option>
              </Select>
            </div>
          </div>
          <div className="min-w-0">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 w-full pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto" icon={Plus}>Add Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
