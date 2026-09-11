import { Badge } from "./ui.jsx";

export default function FeeStatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return <Badge variant="success">PAID</Badge>;
  if (s === "PARTIAL") return <Badge variant="warning">PARTIAL</Badge>;
  if (s === "OVERDUE") return <Badge variant="danger">OVERDUE</Badge>;
  return <Badge variant="muted">PENDING</Badge>;
}