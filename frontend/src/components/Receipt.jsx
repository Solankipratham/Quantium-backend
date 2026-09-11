import { formatINR, formatDate } from "../api/client.js";
import { Button } from "./ui.jsx";

export default function Receipt({ payment, student, previousPaid, pendingBefore, pendingAfter, coaching }) {
  if (!payment) return null;
  const amount = Number(payment.amount) || 0;
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden print:border-black w-full min-w-0">
      <div className="px-3 sm:px-6 py-4 sm:py-5 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full min-w-0">
        <div className="min-w-0">
          <div className="text-[18px] font-extrabold tracking-[0.18em]" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>QUANTUM</div>
          <div className="text-[10px] tracking-[0.2em] text-[#525252]">Academy</div>
          {coaching?.address ? <div className="text-xs text-[#525252] mt-1 break-words">{coaching.address}</div> : null}
        </div>
        <div className="text-left sm:text-right min-w-0">
          <div className="text-xs font-semibold tracking-wide uppercase">Fee Payment Receipt</div>
          <div className="text-xs text-[#525252] mt-1 font-mono break-all">{payment.receiptNumber}</div>
        </div>
      </div>

      <div className="px-3 sm:px-6 py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm w-full min-w-0">
        <div className="min-w-0"><div className="text-xs text-[#525252] uppercase tracking-wide">Student</div><div className="font-semibold truncate">{student?.name || payment.studentName}</div></div>
        <div className="min-w-0"><div className="text-xs text-[#525252] uppercase tracking-wide">Student ID</div><div className="font-mono text-xs truncate">{student?.studentId || "—"}</div></div>
        <div className="min-w-0"><div className="text-xs text-[#525252] uppercase tracking-wide">Payment date</div><div>{formatDate(payment.date)}</div></div>
        <div className="min-w-0"><div className="text-xs text-[#525252] uppercase tracking-wide">Payment method</div><div>{payment.method}</div></div>
        <div className="min-w-0"><div className="text-xs text-[#525252] uppercase tracking-wide">For</div><div className="break-words">{payment.paymentFor || "—"}</div></div>
        <div className="min-w-0"><div className="text-xs text-[#525252] uppercase tracking-wide">Amount paid</div><div className="text-lg font-bold">{formatINR(amount)}</div></div>
      </div>

      <div className="mx-3 sm:mx-6 border-t border-[#E5E5E5]" />

      <div className="px-3 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm w-full min-w-0">
        <div className="p-3 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] min-w-0">
          <div className="text-xs text-[#525252]">Previous pending</div>
          <div className="font-semibold truncate">{formatINR(pendingBefore)}</div>
        </div>
        <div className="p-3 rounded-xl bg-black text-white min-w-0">
          <div className="text-xs opacity-70">Payment</div>
          <div className="font-semibold truncate">{formatINR(amount)}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-black min-w-0">
          <div className="text-xs text-[#525252]">Remaining</div>
          <div className="font-semibold truncate">{formatINR(pendingAfter)}</div>
        </div>
      </div>

      <div className="px-3 sm:px-6 pb-4 sm:pb-6 flex flex-col sm:flex-row gap-2 no-print w-full min-w-0">
        <Button variant="secondary" onClick={() => window.print()} className="w-full sm:w-auto">Print Receipt</Button>
        <Button variant="secondary" onClick={() => {
          const blob = new Blob([document.documentElement.outerHTML], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `${payment.receiptNumber || "receipt"}.html`; a.click();
          URL.revokeObjectURL(url);
        }} className="w-full sm:w-auto">Download</Button>
      </div>

      <div className="px-3 sm:px-6 py-3 bg-[#F5F5F5] border-t border-[#E5E5E5] text-[11px] text-[#525252] text-center break-words">
        Thank you for your payment. For queries contact {coaching?.phone || "+91 98765 43210"} · {coaching?.email || "hello@quantum.in"}
      </div>
    </div>
  );
}
