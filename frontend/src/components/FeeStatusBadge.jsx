import { Badge } from "./ui.jsx";

export default function FeeStatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return <Badge variant="black">PAID</Badge>;
  if (s === "PARTIAL") return <Badge variant="default">PARTIAL</Badge>;
  if (s === "OVERDUE") return <Badge variant="outline">OVERDUE</Badge>;
  return <Badge variant="muted">PENDING</Badge>;
}