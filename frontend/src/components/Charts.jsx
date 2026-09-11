import { useState } from "react";
import { Card } from "./ui.jsx";
import { BarChart3, TrendingUp, PieChart as PieIcon } from "lucide-react";

const PALETTE = {
  brand: "#6366F1",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#0EA5E9",
  purple: "#A855F7",
};

function scale(values, height) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  return values.map((v) => height - ((v - min) / range) * (height - 16) - 8);
}

/* ─── ChartCard (wrapper) ────────────────────────────────────── */
export function ChartCard({ title, subtitle, icon: Icon, children, className = "" }) {
  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        {Icon ? (
          <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-brand-600" />
          </div>
        ) : null}
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div> : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

/* ─── BarChart ────────────────────────────────────────────────── */
export function BarChart({ data = [], height = 200, colors, labels }) {
  const [hovered, setHovered] = useState(null);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <BarChart3 className="w-6 h-6 text-slate-300" />
        </div>
        <div className="text-sm font-medium text-slate-400">No data available</div>
      </div>
    );
  }

  const values = data.map((d) => d.total ?? d.value ?? d.collected ?? 0);
  const max = Math.max(...values, 1);
  const barColors = colors || [
    "url(#barGrad1)", "url(#barGrad2)", "url(#barGrad3)",
    "url(#barGrad4)", "url(#barGrad5)", "url(#barGrad6)",
  ];

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <svg viewBox={`0 0 ${Math.max(data.length * 60, 300)} ${height + 40}`} className="w-full max-w-full" style={{ height: height + 40 }}>
        <defs>
          <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE.brand} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PALETTE.brand} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE.success} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PALETTE.success} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE.info} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PALETTE.info} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="barGrad4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE.purple} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PALETTE.purple} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="barGrad5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE.warning} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PALETTE.warning} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="barGrad6" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE.danger} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PALETTE.danger} stopOpacity="0.6" />
          </linearGradient>
          <filter id="barShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
          </filter>
        </defs>

        {data.map((d, i) => {
          const v = values[i];
          const barH = Math.max(8, (v / max) * (height - 20));
          const gap = 60;
          const x = i * gap + 30;
          const y = height - barH + 10;
          const isHovered = hovered === i;

          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
              <rect
                x={x}
                y={y}
                width={36}
                height={barH}
                rx="8"
                fill={barColors[i % barColors.length]}
                filter={isHovered ? "url(#barShadow)" : undefined}
                opacity={isHovered ? 1 : 0.85}
                style={{ transition: "opacity 0.2s, transform 0.2s", transformOrigin: `${x + 18}px ${height + 10}px`, transform: isHovered ? "scaleY(1.02)" : "scaleY(1)" }}
              />
              {isHovered ? (
                <g>
                  <rect x={x + 18 - 30} y={y - 36} width="60" height="26" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" filter="url(#barShadow)" />
                  <text x={x + 18} y={y - 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1E293B">₹{v.toLocaleString("en-IN")}</text>
                </g>
              ) : null}
              <text x={x + 18} y={height + 28} textAnchor="middle" fontSize="10" fontWeight="500" fill="#94A3B8">
                {(d.label || d.name || "").slice(0, 8)}
              </text>
            </g>
          );
        })}

        <line x1="20" y1={height + 10} x2={data.length * 60 + 10} y2={height + 10} stroke="#E2E8F0" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ─── LineChart ───────────────────────────────────────────────── */
export function LineChart({ data = [], height = 200, color }) {
  const [hovered, setHovered] = useState(null);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6 text-slate-300" />
        </div>
        <div className="text-sm font-medium text-slate-400">No data available</div>
      </div>
    );
  }

  const values = data.map((d) => d.total ?? d.value ?? 0);
  const ys = scale(values, height);
  const w = Math.max(data.length * 70, 400);
  const step = w / Math.max(1, data.length - 1);
  const strokeColor = color || PALETTE.brand;

  const pathD = ys.map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${y}`).join(" ");
  const areaD = `${pathD} L ${(data.length - 1) * step} ${height} L 0 ${height} Z`;

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <svg viewBox={`0 0 ${w} ${height + 30}`} className="w-full max-w-full" style={{ height: height + 30 }}>
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineStrokeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.7" />
            <stop offset="50%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.7" />
          </linearGradient>
          <filter id="lineShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={strokeColor} floodOpacity="0.2" />
          </filter>
        </defs>

        {[0.25, 0.5, 0.75].map((frac) => (
          <line key={frac} x1="0" y1={height * frac + 10} x2={w} y2={height * frac + 10} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        <path d={areaD} fill="url(#lineAreaGrad)" />
        <path d={pathD} fill="none" stroke="url(#lineStrokeGrad)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#lineShadow)" />

        {ys.map((y, i) => {
          const isHovered = hovered === i;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
              <circle cx={i * step} cy={y} r="12" fill="transparent" />
              <circle
                cx={i * step}
                cy={y}
                r={isHovered ? 6 : 4}
                fill="white"
                stroke={strokeColor}
                strokeWidth="2.5"
                style={{ transition: "r 0.2s" }}
              />
              {isHovered ? (
                <g>
                  <rect x={i * step - 32} y={y - 40} width="64" height="26" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" filter="url(#lineShadow)" />
                  <text x={i * step} y={y - 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1E293B">₹{values[i].toLocaleString("en-IN")}</text>
                </g>
              ) : null}
            </g>
          );
        })}

        {data.map((d, i) => (
          <text key={i} x={i * step} y={height + 24} textAnchor="middle" fontSize="10" fontWeight="500" fill="#94A3B8">
            {(d.label || "").slice(0, 8)}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ─── DonutChart ──────────────────────────────────────────────── */
export function DonutChart({ paid = 0, partial = 0, pending = 0, overdue = 0, size = 180 }) {
  const total = paid + partial + pending + overdue || 1;
  const segments = [
    { value: paid, color: PALETTE.success, label: "Paid" },
    { value: partial, color: PALETTE.warning, label: "Partial" },
    { value: pending, color: PALETTE.info, label: "Due" },
    { value: overdue, color: PALETTE.danger, label: "Overdue" },
  ].filter((s) => s.value > 0);

  const r = 58;
  const c = 2 * Math.PI * r;
  let acc = 0;

  if (!total || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <PieIcon className="w-6 h-6 text-slate-300" />
        </div>
        <div className="text-sm font-medium text-slate-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full min-w-0 overflow-hidden">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox="0 0 140 140" className="max-w-full">
          <defs>
            <filter id="donutShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
            </filter>
          </defs>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#F1F5F9" strokeWidth="18" />
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const off = (acc / total) * c;
            acc += s.value;
            return (
              <circle
                key={i}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-off}
                transform="rotate(-90 70 70)"
                strokeLinecap="round"
                filter="url(#donutShadow)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            );
          })}
          <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1E293B">{total}</text>
          <text x="70" y="82" textAnchor="middle" fontSize="9" fontWeight="500" fill="#94A3B8" letterSpacing="0.05em">TOTAL</text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs w-full sm:w-auto min-w-0">
        {[
          { label: "Paid", value: paid, color: PALETTE.success, bg: "bg-success-50", text: "text-success-700", border: "border-success-200" },
          { label: "Partial", value: partial, color: PALETTE.warning, bg: "bg-warning-50", text: "text-warning-700", border: "border-warning-200" },
          { label: "Due", value: pending, color: PALETTE.info, bg: "bg-info-50", text: "text-info-700", border: "border-info-200" },
          { label: "Overdue", value: overdue, color: PALETTE.danger, bg: "bg-danger-50", text: "text-danger-700", border: "border-danger-200" },
        ].map((item) => (
          <div key={item.label} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${item.bg} border ${item.border}`}>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <div className="min-w-0">
              <div className={`font-bold text-base ${item.text}`}>{item.value}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DonutChart as Donut };
