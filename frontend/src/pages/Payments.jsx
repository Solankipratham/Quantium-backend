import { useEffect, useState } from "react";
import { api, formatINR, formatDate } from "../api/client.js";
import { Card, Button, Select, Input, LoadingState, EmptyState, Badge, Modal, PageHeader, Avatar } from "../components/ui.jsx";
import Receipt from "../components/Receipt.jsx";
import { Receipt as ReceiptIcon, Search, CreditCard, FileText } from "lucide-react";

const methodVariant = (method) => {
  const m = String(method || "").toLowerCase();
  if (m === "cash") return "success";
  if (m === "upi") return "primary";
  if (m === "bank transfer") return "purple";
  if (m === "card") return "info";
  return "muted";
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("all");
  const [receipt, setReceipt] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = () => {
    setLoading(true);
    const qs = method !== "all" ? `?method=${method}` : "";
    api(`/api/payments${qs}`).then((r) => setPayments(r.payments || [])).finally(() => setLoading(false));
  };
  useEffect(load, [method]);

  const openReceipt = async (p) => {
    const r = await api(`/api/payments/${p.id}`);
    setReceipt(r);
  };

  const filtered = payments.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (![p.studentName, p.receiptNumber, p.paymentFor, p.method].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))) return false;
    }
    if (dateFrom && p.date < dateFrom) return false;
    if (dateTo && p.date > dateTo) return false;
    return true;
  });

  const totalAmount = filtered.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Payment History"
        subtitle={`${filtered.length} payment${filtered.length !== 1 ? "s" : ""} recorded — ${formatINR(totalAmount)} total`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <FileText className="w-4 h-4" /> Export
            </Button>
          </div>
        }
      />

      <Card className="p-4 w-full min-w-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student, receipt, method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>
          <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full sm:w-[150px]">
            <option value="all">All Methods</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
            <option>Card</option>
            <option>Other</option>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-[150px]" placeholder="From" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-[150px]" placeholder="To" />
        </div>
      </Card>

      {loading ? (
        <LoadingState label="Loading payments..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No payments found"
          description="No payments match your current filters."
          icon={CreditCard}
        />
      ) : (
        <>
          <Card className="hidden lg:block overflow-x-auto w-full min-w-0">
            <table className="w-full text-sm min-w-[740px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Receipt</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">For</th>
                  <th className="text-right px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                          <ReceiptIcon className="w-4 h-4 text-brand-500" />
                        </div>
                        <span className="font-mono text-xs text-slate-600">{p.receiptNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.studentName} size="sm" />
                        <span className="font-medium text-slate-900 truncate">{p.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">{formatINR(p.amount)}</td>
                    <td className="px-4 py-4"><Badge variant={methodVariant(p.method)}>{p.method}</Badge></td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(p.date)}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{p.paymentFor || "—"}</td>
                    <td className="px-5 py-4 text-right">
                      <Button size="sm" variant="secondary" onClick={() => openReceipt(p)}>
                        <ReceiptIcon className="w-3.5 h-3.5" /> Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="lg:hidden grid gap-3 w-full min-w-0">
            {filtered.map((p) => (
              <Card key={p.id} className="p-4 w-full min-w-0 overflow-hidden hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={p.studentName} size="sm" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">{p.studentName}</div>
                      <div className="text-xs font-mono text-slate-400 truncate">{p.receiptNumber} · {formatDate(p.date)}</div>
                    </div>
                  </div>
                  <Badge variant={methodVariant(p.method)}>{p.method}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3 gap-2">
                  <div className="text-lg font-bold font-mono text-slate-900">{formatINR(p.amount)}</div>
                  <div className="text-xs text-slate-500 truncate">{p.paymentFor || "—"}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openReceipt(p)} className="w-full mt-3">
                  <ReceiptIcon className="w-3.5 h-3.5" /> View Receipt
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Payment Receipt" width="max-w-2xl">
        {receipt ? <Receipt payment={receipt.payment} student={receipt.student} previousPaid={receipt.previousPaid} pendingBefore={receipt.pending} pendingAfter={receipt.afterPayment?.pending} coaching={receipt.coaching} /> : null}
      </Modal>
    </div>
  );
}
