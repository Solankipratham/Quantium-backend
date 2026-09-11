import { useEffect, useState } from "react";
import { api, formatINR, formatDate } from "../api/client.js";
import { Card, Button, Input, LoadingState, EmptyState, Badge, PageHeader, StatCard, Avatar } from "../components/ui.jsx";
import { Banknote, CreditCard, Smartphone, Building2, Wallet, TrendingUp } from "lucide-react";

export default function CollectionsDaily() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api(`/api/collections/daily?date=${date}`).then(setData).finally(() => setLoading(false));
  };
  useEffect(load, [date]);

  if (loading) return <LoadingState label="Loading daily collection..." />;

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Daily Collection"
        subtitle={formatDate(data?.date)}
        action={
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-[170px]" />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full min-w-0">
        <StatCard
          title="Today's Collection"
          value={formatINR(data?.total || 0)}
          icon={TrendingUp}
          color="brand"
          subtitle={`${data?.count || 0} payments`}
        />
        <StatCard
          title="Cash"
          value={formatINR(data?.cash || 0)}
          icon={Banknote}
          color="success"
          subtitle="In-hand"
        />
        <StatCard
          title="UPI"
          value={formatINR(data?.upi || 0)}
          icon={Smartphone}
          color="primary"
          subtitle="Digital"
        />
        <StatCard
          title="Bank Transfer"
          value={formatINR(data?.bankTransfer || 0)}
          icon={Building2}
          color="purple"
          subtitle="Direct transfer"
        />
        <StatCard
          title="Card"
          value={formatINR(data?.card || 0)}
          icon={CreditCard}
          color="info"
          subtitle="Card payments"
        />
      </div>

      {!data?.payments?.length ? (
        <EmptyState
          title="No payments today"
          description="No payments have been recorded for this date."
          icon={Wallet}
        />
      ) : (
        <>
          <Card className="hidden lg:block overflow-x-auto w-full min-w-0">
            <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
              Payments for {formatDate(data?.date)}
            </div>
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Time</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.studentName} size="sm" />
                        <span className="font-medium text-slate-900">{p.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">{formatINR(p.amount)}</td>
                    <td className="px-4 py-4"><Badge variant={p.method === "Cash" ? "success" : p.method === "UPI" ? "primary" : "purple"}>{p.method}</Badge></td>
                    <td className="px-4 py-4 text-sm text-slate-600">{new Date(p.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{p.receiptNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="lg:hidden grid gap-3 w-full min-w-0">
            {data.payments.map((p) => (
              <Card key={p.id} className="p-4 w-full min-w-0 overflow-hidden hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={p.studentName} size="sm" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">{p.studentName}</div>
                      <div className="text-xs font-mono text-slate-400 truncate">{p.receiptNumber}</div>
                    </div>
                  </div>
                  <Badge variant={p.method === "Cash" ? "success" : p.method === "UPI" ? "primary" : "purple"}>{p.method}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3 gap-2">
                  <div className="text-lg font-bold font-mono text-slate-900">{formatINR(p.amount)}</div>
                  <div className="text-xs text-slate-500">{new Date(p.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
