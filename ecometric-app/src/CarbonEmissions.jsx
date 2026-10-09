/**
 * EcoMetric – Màn hình 3: Phát thải carbon
 * Phong cách: Apple "iOS Liquid Glass" (glass / glass-thin / glass-press từ index.css)
 *
 * Stack: React + Tailwind CSS v4 + lucide-react
 * Gồm 4 khối chính:
 *   1. Thẻ tổng quan phát thải theo Scope 1 / Scope 2 / Scope 3
 *   2. Biểu đồ xu hướng phát thải thực tế vs Mục tiêu Net Zero
 *   3. Bản đồ nhiệt phân bổ CO2e theo nhà xưởng / chi nhánh
 *   4. Bộ lọc mốc thời gian (Tháng / Quý / Năm)
 */
import { useMemo, useState } from "react";
import {
  Activity,
  Building2,
  CalendarRange,
  CircleDot,
  Download,
  Factory,
  FileSpreadsheet,
  Flame,
  Info,
  Package,
  PlugZap,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import {
  buildCarbonSheets,
  buildCarbonPdfTables,
  exportToExcel,
  exportToPdf,
} from "./lib/export.js";

/* ────────────────────────────────
   1. DESIGN TOKENS (kế thừa bảng màu của Dashboard)
   ──────────────────────────────── */
const COLOR = {
  emerald: "#10b981",
  emeraldDark: "#059669",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  ink: "#0f172a",
  slate: "#64748b",
  muted: "#94a3b8",
  line: "#e2e8f0",
};

// Lớp bề mặt kính – dùng lại utility "glass" đã khai báo trong index.css
const GLASS = "glass glass-press";
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]";
const LABEL =
  "flex items-center gap-[6px] text-[12px] font-semibold text-[#64748b]";

// Nút hành động xuất tệp – đồng bộ với trang Báo cáo ESG.
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#10b981] px-4 py-[10px] " +
  `text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#10b981] ${FOCUS}`;
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-4 py-[10px] " +
  `text-[13px] font-semibold text-[#0f172a] backdrop-blur-[12px] transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS}`;

/* ────────────────────────────────
   2. DỮ LIỆU MẪU (thay bằng API sau này)
   ──────────────────────────────── */

/* — Danh mục Scope theo chuẩn GHG Protocol — */
const SCOPES = [
  {
    id: "scope1",
    name: "Scope 1",
    subtitle: "Trực tiếp",
    hint: "Đốt nhiên liệu tại nhà máy, đội xe nội bộ",
    icon: Flame,
    color: COLOR.red,
  },
  {
    id: "scope2",
    name: "Scope 2",
    subtitle: "Gián tiếp",
    hint: "Điện & nước mua ngoài đã tiêu thụ",
    icon: PlugZap,
    color: COLOR.amber,
  },
  {
    id: "scope3",
    name: "Scope 3",
    subtitle: "Chuỗi cung ứng",
    hint: "Nguyên liệu, logistics thuê ngoài, bao bì",
    icon: Truck,
    color: COLOR.violet,
  },
];

/* — Tổng hợp theo 3 mốc thời gian: Tháng / Quý / Năm — */
const PERIOD_OPTIONS = [
  { id: "month", label: "Tháng", icon: CalendarRange },
  { id: "quarter", label: "Quý", icon: CircleDot },
  { id: "year", label: "Năm", icon: Building2 },
];

const PERIOD_LABEL = {
  month: {
    title: "Tháng 10/2025",
    compare: "so với tháng 09/2025",
    unitStep: 1,
  },
  quarter: { title: "Quý 4/2025", compare: "so với Quý 3/2025", unitStep: 3 },
  year: { title: "Năm 2025", compare: "so với năm 2024", unitStep: 12 },
};

/* — Chỉ số từng Scope theo mốc thời gian (tấn CO2e) — */
const SCOPE_DATA = {
  month: {
    scope1: { value: 312.4, prev: 348.0, target: 300.0 },
    scope2: { value: 428.9, prev: 465.2, target: 410.0 },
    scope3: { value: 504.5, prev: 481.7, target: 520.0 },
  },
  quarter: {
    scope1: { value: 968.1, prev: 1042.6, target: 930.0 },
    scope2: { value: 1296.4, prev: 1388.9, target: 1240.0 },
    scope3: { value: 1502.7, prev: 1456.3, target: 1560.0 },
  },
  year: {
    scope1: { value: 3862.0, prev: 4188.4, target: 3600.0 },
    scope2: { value: 5204.8, prev: 5588.1, target: 4900.0 },
    scope3: { value: 6011.3, prev: 5812.9, target: 6300.0 },
  },
};

/* — Xu hướng thực tế vs quỹ đạo Net Zero (tấn CO2e) — */
const TREND_DATA = {
  month: {
    xLabels: ["T4", "T5", "T6", "T7", "T8", "T9", "T10"],
    actual: [1412, 1378, 1330, 1296, 1288, 1297, 1245.8],
    plan: [1440, 1390, 1340, 1292, 1246, 1202, 1160],
  },
  quarter: {
    xLabels: ["Q4/24", "Q1/25", "Q2/25", "Q3/25", "Q4/25"],
    actual: [4180, 4062, 3975, 3884, 3767.2],
    plan: [4300, 4120, 3960, 3800, 3640],
  },
  year: {
    xLabels: ["2021", "2022", "2023", "2024", "2025"],
    actual: [19260, 18120, 17040, 15589.4, 15078.1],
    plan: [19260, 17980, 16700, 15420, 14140],
  },
};

/* — Phân bổ CO2e theo nhà xưởng / chi nhánh — */
const SITES = [
  {
    id: "a",
    name: "Nhà máy A – Dệt nhuộm",
    kind: "Nhà xưởng",
    region: "Bình Dương",
    icon: Factory,
  },
  {
    id: "b",
    name: "Nhà máy B – May mặc",
    kind: "Nhà xưởng",
    region: "Đồng Nai",
    icon: Factory,
  },
  {
    id: "c",
    name: "Nhà máy C – Xử lý nước",
    kind: "Nhà xưởng",
    region: "Long An",
    icon: Factory,
  },
  {
    id: "d",
    name: "Kho trung tâm – Logistics",
    kind: "Chi nhánh",
    region: "TP.HCM",
    icon: Package,
  },
  {
    id: "e",
    name: "Chi nhánh Hà Nội",
    kind: "Chi nhánh",
    region: "Hà Nội",
    icon: Building2,
  },
  {
    id: "f",
    name: "Chi nhánh Đà Nẵng",
    kind: "Chi nhánh",
    region: "Đà Nẵng",
    icon: Building2,
  },
];

/* Lượng phát thải theo từng địa điểm × từng Scope (tấn CO2e) */
const SITE_MATRIX = {
  month: {
    a: { scope1: 118.6, scope2: 152.4, scope3: 168.2 },
    b: { scope1: 96.1, scope2: 118.7, scope3: 142.9 },
    c: { scope1: 54.3, scope2: 92.5, scope3: 76.4 },
    d: { scope1: 28.9, scope2: 41.8, scope3: 88.1 },
    e: { scope1: 9.4, scope2: 15.2, scope3: 18.6 },
    f: { scope1: 5.1, scope2: 8.3, scope3: 10.3 },
  },
  quarter: {
    a: { scope1: 368.2, scope2: 472.9, scope3: 502.4 },
    b: { scope1: 298.4, scope2: 368.1, scope3: 428.7 },
    c: { scope1: 168.5, scope2: 287.2, scope3: 229.1 },
    d: { scope1: 89.7, scope2: 129.6, scope3: 263.8 },
    e: { scope1: 29.1, scope2: 47.2, scope3: 55.8 },
    f: { scope1: 14.2, scope2: 25.4, scope3: 22.9 },
  },
  year: {
    a: { scope1: 1468.4, scope2: 1892.7, scope3: 2009.6 },
    b: { scope1: 1192.8, scope2: 1472.4, scope3: 1714.8 },
    c: { scope1: 674.2, scope2: 1148.8, scope3: 916.4 },
    d: { scope1: 358.8, scope2: 518.4, scope3: 1055.2 },
    e: { scope1: 116.4, scope2: 188.8, scope3: 223.2 },
    f: { scope1: 51.4, scope2: 101.6, scope3: 92.1 },
  },
};

/* Bản đồ nhiệt: chỉ số dùng để tô màu ô */
const HEAT_MODES = [
  { id: "total", label: "Tổng CO2e" },
  { id: "scope1", label: "Scope 1" },
  { id: "scope2", label: "Scope 2" },
  { id: "scope3", label: "Scope 3" },
];

const NET_ZERO = {
  targetYear: 2030,
  baseline: 2021,
  plan: "Giảm 42% phát thải so với mốc cơ sở 2021",
};

/* ────────────────────────────────
   3. HÀM TIỆN ÍCH
   ──────────────────────────────── */
const fmt = (n, digits = 1) =>
  n.toLocaleString("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const pctDelta = (value, prev) => ((value - prev) / prev) * 100;

/* ────────────────────────────────
   4. THÀNH PHẦN GIAO DIỆN
   ──────────────────────────────── */

/* ── Bộ lọc mốc thời gian (segmented control kiểu iOS) ─────────── */
function PeriodFilter({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Mốc thời gian"
      className="glass-press inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/45 p-1 backdrop-blur-[16px]"
    >
      {PERIOD_OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 rounded-full px-[16px] py-[7px] text-[13px] font-semibold transition-all ${FOCUS} ${
              active
                ? "bg-[#10b981] text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.85)]"
                : "text-[#64748b] hover:bg-white/70 hover:text-[#0f172a]"
            }`}
          >
            <Icon size={14} strokeWidth={2.4} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Thẻ tổng quan theo Scope ─────────────────────────────────── */
function ScopeCard({ scope, value, prev, target }) {
  const Icon = scope.icon;
  const delta = pctDelta(value, prev);
  const up = delta > 0; // phát thải tăng = xấu
  const ratio = Math.min(100, Math.round((value / target) * 100));
  const overBudget = value > target;

  return (
    <article
      className={`${GLASS} relative flex flex-col gap-4 overflow-hidden p-4 sm:p-5`}
    >
      {/* Vệt màu nhận diện Scope */}
      <span
        className="absolute bottom-0 left-0 top-0 w-1"
        style={{ backgroundColor: scope.color }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
            style={{ backgroundColor: `${scope.color}1f` }}
          >
            <Icon size={19} strokeWidth={2.2} color={scope.color} />
          </span>
          <div className="flex flex-col">
            <h3 className="text-[15px] font-bold text-[#0f172a]">
              {scope.name}
            </h3>
            <span className="text-[12px] text-[#64748b]">{scope.subtitle}</span>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-[5px] rounded-full px-[10px] py-[4px] text-[12px] font-semibold ${
            up
              ? "bg-[#fee2e2] text-[#991b1b]"
              : "bg-[#10b981]/12 text-[#059669]"
          }`}
        >
          {up ? (
            <TrendingUp size={13} strokeWidth={2.6} />
          ) : (
            <TrendingDown size={13} strokeWidth={2.6} />
          )}
          {up ? "+" : ""}
          {fmt(delta)}%
        </span>
      </div>

      <div className="flex flex-col gap-[2px]">
        <p className="text-[26px] font-extrabold leading-tight text-[#0f172a]">
          {fmt(value)}{" "}
          <span className="text-[13px] font-semibold text-[#64748b]">
            tấn CO2e
          </span>
        </p>
        <p className="text-[11px] text-[#94a3b8]">{scope.hint}</p>
      </div>

      {/* Thanh tiến độ so với hạn mức Net Zero */}
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-[#64748b]">
            Hạn mức kỳ này: {fmt(target, 0)} tấn
          </span>
          <span className={overBudget ? "text-[#b45309]" : "text-[#059669]"}>
            {ratio}%{overBudget ? " · vượt hạn mức" : " · trong hạn mức"}
          </span>
        </div>
        <div className="h-[7px] w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${ratio}%`,
              backgroundColor: overBudget ? COLOR.amber : COLOR.emerald,
            }}
          />
        </div>
      </div>
    </article>
  );
}

/* ── Biểu đồ xu hướng: Thực tế vs Mục tiêu Net Zero ──────────── */
function EmissionsTrendChart({ period }) {
  const { xLabels, actual, plan } = TREND_DATA[period];

  const W = 700;
  const H = 250;
  const PAD = { top: 18, right: 16, bottom: 30, left: 52 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const allValues = [...actual, ...plan];
  const rawMax = Math.max(...allValues);
  const rawMin = Math.min(...allValues);
  const step = Math.pow(10, Math.floor(Math.log10(rawMax - rawMin || 1)));
  const yMax = Math.ceil(rawMax / step) * step + step; // đỉnh trục Y có khoảng đệm
  const yMin = Math.max(0, Math.floor(rawMin / step) * step - step);

  const stepX = xLabels.length > 1 ? plotW / (xLabels.length - 1) : plotW;
  const toX = (i) => PAD.left + i * stepX;
  const toY = (v) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const actualPts = actual.map((v, i) => [toX(i), toY(v)]);
  const planPts = plan.map((v, i) => [toX(i), toY(v)]);
  const line = (pts) =>
    pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    `${line(actualPts)} L${actualPts[actualPts.length - 1][0].toFixed(1)},${(PAD.top + plotH).toFixed(1)} ` +
    `L${actualPts[0][0].toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`;

  const yTicks = 5;
  const yGrid = Array.from(
    { length: yTicks + 1 },
    (_, i) => yMin + ((yMax - yMin) * i) / yTicks,
  ).reverse();

  const last = actual[actual.length - 1];
  const lastPlan = plan[plan.length - 1];
  const gapPct = ((last - lastPlan) / lastPlan) * 100;

  return (
    <section
      className={`${GLASS} flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-[#0f172a]">
            Xu hướng phát thải vs Mục tiêu Net Zero
          </h2>
          <p className="text-[12px] text-[#64748b]">
            Đường thực tế so với quỹ đạo cần thiết để đạt Net Zero vào{" "}
            {NET_ZERO.targetYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-[6px] text-[12px] font-semibold text-[#64748b]">
            <span
              className="h-[3px] w-5 rounded-full"
              style={{ backgroundColor: COLOR.emerald }}
            />
            Thực tế
          </span>
          <span className="inline-flex items-center gap-[6px] text-[12px] font-semibold text-[#64748b]">
            <span
              className="h-[3px] w-5 rounded-full"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${COLOR.blue} 0 6px, transparent 6px 11px)`,
              }}
            />
            Mục tiêu Net Zero
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Biểu đồ đường so sánh phát thải thực tế với mục tiêu Net Zero"
      >
        <defs>
          <linearGradient id="ecoActualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR.emerald} stopOpacity="0.28" />
            <stop offset="100%" stopColor={COLOR.emerald} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Lưới ngang + nhãn trục Y */}
        {yGrid.map((v, i) => {
          const y = PAD.top + (plotH * i) / yTicks;
          return (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke={COLOR.line}
                strokeWidth="1"
              />
              <text
                x={PAD.left - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize="11"
                fill={COLOR.muted}
              >
                {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Vùng dưới đường thực tế */}
        <path d={area} fill="url(#ecoActualFill)" />

        {/* Đường mục tiêu Net Zero (nét đứt) */}
        <polyline
          points={line(planPts)}
          fill="none"
          stroke={COLOR.blue}
          strokeWidth="2.5"
          strokeDasharray="7 6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Đường thực tế */}
        <polyline
          points={line(actualPts)}
          fill="none"
          stroke={COLOR.emerald}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Điểm dữ liệu thực tế */}
        {actualPts.map(([x, y], i) => (
          <circle
            key={x}
            cx={x}
            cy={y}
            r={i === actualPts.length - 1 ? 5.5 : 3.6}
            fill="#ffffff"
            stroke={COLOR.emeraldDark}
            strokeWidth="2.5"
          >
            <title>{`${xLabels[i]}: ${fmt(actual[i])} tấn CO2e`}</title>
          </circle>
        ))}

        {/* Nhãn trục X */}
        {xLabels.map((label, i) => (
          <text
            key={label}
            x={toX(i)}
            y={H - 10}
            textAnchor={
              i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"
            }
            dominantBaseline="central"
            fontSize="11"
            fill={COLOR.muted}
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Dải thông tin dưới biểu đồ */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="inline-flex items-center gap-2 rounded-[12px] bg-white/55 px-3 py-[8px] text-[12px] text-[#0f172a]">
          <Activity size={14} strokeWidth={2.4} color={COLOR.emeraldDark} />
          Kỳ gần nhất: <b>{fmt(last)} tấn CO2e</b>
        </p>
        <p
          className={`inline-flex items-center gap-2 rounded-[12px] px-3 py-[8px] text-[12px] font-semibold ${
            last > lastPlan
              ? "bg-[#fef3c7] text-[#b45309]"
              : "bg-[#10b981]/12 text-[#059669]"
          }`}
        >
          <Info size={14} strokeWidth={2.4} />
          {last > lastPlan
            ? `Cao hơn quỹ đạo Net Zero ${fmt(Math.abs(gapPct))}%`
            : `Thấp hơn quỹ đạo Net Zero ${fmt(Math.abs(gapPct))}% – đúng lộ trình`}
        </p>
      </div>
    </section>
  );
}

/* ── Bản đồ nhiệt phân bổ CO2e theo nhà xưởng / chi nhánh ────── */
function heatColor(t) {
  // t ∈ [0,1] → nội suy emerald → amber → đỏ (thang RdYlGn đảo)
  const stops = [
    { at: 0, rgb: [16, 185, 129] },
    { at: 0.5, rgb: [245, 158, 11] },
    { at: 1, rgb: [239, 68, 68] },
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (t >= stops[i].at && t <= stops[i + 1].at) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi.at - lo.at || 1;
  const k = (t - lo.at) / span;
  const rgb = lo.rgb.map((c, i) => Math.round(c + (hi.rgb[i] - c) * k));
  return `rgb(${rgb.join(", ")})`;
}

function HeatmapCard({ period }) {
  const [mode, setMode] = useState("total");
  const matrix = SITE_MATRIX[period];

  // Tính giá trị của từng ô theo chế độ đang chọn
  const rows = SITES.map((site) => {
    const cells = SCOPES.map((scope) => {
      const v = matrix[site.id][scope.id];
      return { scopeId: scope.id, value: v };
    });
    const total = cells.reduce((sum, c) => sum + c.value, 0);
    return { site, cells, total };
  });

  const totalAll = rows.reduce((sum, r) => sum + r.total, 0);
  const maxCell = Math.max(...rows.flatMap((r) => r.cells.map((c) => c.value)));
  const minCell = Math.min(...rows.flatMap((r) => r.cells.map((c) => c.value)));

  // Trọng số (%) theo cột / theo dòng tuỳ chế độ
  const cellWeight = (value) => {
    const span = maxCell - minCell || 1;
    return (value - minCell) / span;
  };

  const modeTotal = (row) =>
    mode === "total"
      ? row.total
      : row.cells.find((c) => c.scopeId === mode).value;

  const grandTotalForMode =
    mode === "total" ? totalAll : rows.reduce((s, r) => s + modeTotal(r), 0);

  const maxForBar = Math.max(...rows.map((r) => modeTotal(r))) || 1;

  return (
    <section
      className={`${GLASS} flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-[#0f172a]">
            Bản đồ nhiệt phân bổ CO2e
          </h2>
          <p className="text-[12px] text-[#64748b]">
            Mức phát thải theo từng nhà xưởng / chi nhánh –{" "}
            {PERIOD_LABEL[period].title}
          </p>
        </div>

        <div className="glass-press inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/45 p-1">
          {HEAT_MODES.map(({ id, label }) => {
            const active = id === mode;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-pressed={active}
                className={`rounded-full px-[12px] py-[5px] text-[12px] font-semibold transition-all ${FOCUS} ${
                  active
                    ? "bg-white text-[#0f172a] shadow-[0_2px_6px_-2px_rgba(15,23,42,0.25)]"
                    : "text-[#64748b] hover:text-[#0f172a]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bảng nhiệt */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Hàng tiêu đề */}
          <div className="flex items-center gap-3 rounded-t-[14px] border border-white/60 bg-white/55 px-4 py-[10px] text-[12px] font-semibold text-[#64748b] backdrop-blur-[12px]">
            <span className="w-[240px] shrink-0">Nhà xưởng / Chi nhánh</span>
            {SCOPES.map((s) => (
              <span key={s.id} className="w-[92px] shrink-0 text-center">
                {s.name}
              </span>
            ))}
            <span className="min-w-[120px] flex-1 text-right">Tổng CO2e</span>
          </div>

          {/* Các dòng dữ liệu */}
          {rows.map(({ site, cells, total }, idx) => {
            const Icon = site.icon;
            const rowVal = modeTotal({ site, cells, total });
            const share = grandTotalForMode
              ? (rowVal / grandTotalForMode) * 100
              : 0;
            return (
              <div
                key={site.id}
                className={`flex items-center gap-3 border-x border-b border-white/60 px-4 py-[10px] transition-colors hover:bg-white/70 ${
                  idx === rows.length - 1 ? "rounded-b-[14px]" : ""
                } ${idx % 2 === 1 ? "bg-white/30" : "bg-white/45"}`}
              >
                {/* Tên địa điểm */}
                <div className="flex w-[240px] shrink-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/70">
                    <Icon
                      size={15}
                      strokeWidth={2.2}
                      color={COLOR.emeraldDark}
                    />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold text-[#0f172a]">
                      {site.name}
                    </span>
                    <span className="text-[11px] text-[#94a3b8]">
                      {site.kind} · {site.region}
                    </span>
                  </div>
                </div>

                {/* Ô nhiệt theo Scope */}
                {cells.map(({ scopeId, value }) => {
                  const scope = SCOPES.find((s) => s.id === scopeId);
                  const strong = cellWeight(value) > 0.62;
                  return (
                    <div
                      key={scopeId}
                      className="flex w-[92px] shrink-0 flex-col items-center gap-1"
                    >
                      <div
                        className="flex h-[38px] w-full items-center justify-center rounded-[10px] text-[12px] font-bold transition-transform hover:scale-[1.04]"
                        style={{
                          backgroundColor: heatColor(cellWeight(value) * 0.88),
                          color: "#ffffff",
                          boxShadow: `0 4px 10px -6px ${scope.color}`,
                        }}
                        title={`${site.name} · ${scope.name}: ${fmt(value)} tấn CO2e`}
                      >
                        {fmt(value, 0)}
                      </div>
                      <span
                        className={`text-[10px] ${strong ? "text-[#0f172a]" : "text-[#94a3b8]"}`}
                      >
                        {(
                          (value / (mode === "total" ? total : rowVal || 1)) *
                          100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                  );
                })}

                {/* Tổng + thanh tỉ trọng */}
                <div className="flex min-w-[120px] flex-1 flex-col items-end gap-[6px]">
                  <span className="text-[13px] font-bold text-[#0f172a]">
                    {fmt(rowVal)} tấn
                  </span>
                  <div className="flex w-full items-center justify-end gap-2">
                    <div className="h-[6px] w-full max-w-[110px] overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${(rowVal / maxForBar) * 100}%`,
                          backgroundColor: COLOR.emeraldDark,
                        }}
                      />
                    </div>
                    <span className="w-[42px] shrink-0 text-right text-[11px] font-semibold text-[#64748b]">
                      {share.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chú giải thang màu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#64748b]">Thấp</span>
          <div
            className="h-[10px] w-[180px] rounded-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${heatColor(0)}, ${heatColor(0.44)}, ${heatColor(0.88)})`,
            }}
          />
          <span className="text-[11px] font-semibold text-[#64748b]">Cao</span>
        </div>
        <span className="text-[11px] text-[#94a3b8]">
          Đơn vị: tấn CO2e · chỉ số tô màu theo bộ lọc đang chọn
        </span>
      </div>
    </section>
  );
}

/* ── Panel phụ: tiến độ Net Zero + cơ cấu Scope ──────────────── */
function NetZeroPanel({ period }) {
  const data = SCOPE_DATA[period];
  const totalActual = SCOPES.reduce((s, x) => s + data[x.id].value, 0);
  const totalPlan = SCOPES.reduce((s, x) => s + data[x.id].target, 0);
  const gap = totalActual - totalPlan;

  // Tiến độ giảm phát thải so với mốc cơ sở 2021 (lấy theo mốc Năm)
  const baseline =
    SCOPE_DATA.year.scope1.value +
    SCOPE_DATA.year.scope2.value +
    SCOPE_DATA.year.scope3.value;
  const yearActual =
    SCOPE_DATA.year.scope1.value +
    SCOPE_DATA.year.scope2.value +
    SCOPE_DATA.year.scope3.value;
  const reduction = ((baseline - yearActual) / baseline) * 100;

  return (
    <section
      className={`${GLASS} flex w-full shrink-0 flex-col gap-5 p-4 sm:p-5 xl:w-[400px]`}
    >
      <div className="flex items-center gap-2">
        <Activity size={18} strokeWidth={2.2} color={COLOR.emeraldDark} />
        <h2 className="text-[15px] font-bold text-[#0f172a]">
          Lộ trình Net Zero
        </h2>
      </div>

      {/* Vòng tròn tiến độ */}
      <div className="flex items-center gap-4">
        <div className="relative h-[126px] w-[126px] shrink-0">
          <svg
            viewBox="0 0 126 126"
            className="h-full w-full"
            role="img"
            aria-label="Tiến độ giảm phát thải"
          >
            <circle
              cx="63"
              cy="63"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="14"
            />
            <circle
              cx="63"
              cy="63"
              r="52"
              fill="none"
              stroke={COLOR.emerald}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${(2 * Math.PI * 52 * reduction) / 100} ${2 * Math.PI * 52}`}
              transform="rotate(-90 63 63)"
            />
          </svg>
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="text-[20px] font-extrabold text-[#0f172a]">
              {reduction.toFixed(1)}%
            </span>
            <span className="text-[10px] text-[#64748b]">đã giảm</span>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-[10px]">
          <li className="flex flex-col gap-[2px]">
            <span className="text-[11px] text-[#64748b]">Mốc cơ sở</span>
            <span className="text-[13px] font-semibold text-[#0f172a]">
              {NET_ZERO.baseline} · {fmt(baseline, 0)} tấn
            </span>
          </li>
          <li className="flex flex-col gap-[2px]">
            <span className="text-[11px] text-[#64748b]">
              Mục tiêu Net Zero
            </span>
            <span className="text-[13px] font-semibold text-[#0f172a]">
              {NET_ZERO.targetYear}
            </span>
          </li>
          <li className="flex flex-col gap-[2px]">
            <span className="text-[11px] text-[#64748b]">Lộ trình</span>
            <span className="text-[13px] font-semibold text-[#059669]">
              {NET_ZERO.plan}
            </span>
          </li>
        </ul>
      </div>

      {/* Chênh lệch kỳ hiện tại */}
      <div
        className={`flex items-start gap-3 rounded-[14px] px-4 py-3 ${
          gap > 0 ? "bg-[#fef3c7]" : "bg-[#10b981]/12"
        }`}
      >
        {gap > 0 ? (
          <Info
            size={17}
            strokeWidth={2.4}
            color="#b45309"
            className="mt-[2px] shrink-0"
          />
        ) : (
          <TrendingDown
            size={17}
            strokeWidth={2.4}
            color={COLOR.emeraldDark}
            className="mt-[2px] shrink-0"
          />
        )}
        <div className="flex flex-col gap-[2px]">
          <span
            className={`text-[12px] font-bold ${gap > 0 ? "text-[#b45309]" : "text-[#059669]"}`}
          >
            {gap > 0
              ? `Vượt hạn mức ${fmt(gap)} tấn CO2e`
              : `Dưới hạn mức ${fmt(Math.abs(gap))} tấn CO2e`}
          </span>
          <span className="text-[11px] text-[#64748b]">
            Tổng thực tế {fmt(totalActual)} tấn vs hạn mức {fmt(totalPlan, 0)}{" "}
            tấn ({PERIOD_LABEL[period].title})
          </span>
        </div>
      </div>

      {/* Cơ cấu theo Scope */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[13px] font-bold text-[#0f172a]">
          Cơ cấu phát thải theo Scope
        </h3>
        <div className="flex h-[10px] w-full overflow-hidden rounded-full">
          {SCOPES.map((s) => (
            <span
              key={s.id}
              style={{
                width: `${(data[s.id].value / totalActual) * 100}%`,
                backgroundColor: s.color,
              }}
              title={`${s.name}: ${fmt(data[s.id].value)} tấn`}
            />
          ))}
        </div>
        <ul className="flex flex-col gap-[6px]">
          {SCOPES.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className="h-[10px] w-[10px] shrink-0 rounded-[3px]"
                style={{ backgroundColor: s.color }}
              />
              <span className="flex-1 text-[12px] font-medium text-[#0f172a]">
                {s.name}
              </span>
              <span className="whitespace-nowrap text-[12px] font-semibold text-[#64748b]">
                {((data[s.id].value / totalActual) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ────────────────────────────────
   5. TRANG PHÁT THẢI CARBON
   ──────────────────────────────── */
export default function CarbonEmissions() {
  const [period, setPeriod] = useState("month");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const scopeData = SCOPE_DATA[period];
  const total = useMemo(
    () => SCOPES.reduce((s, x) => s + scopeData[x.id].value, 0),
    [scopeData],
  );

  /* ── Xuất EXCEL: Scope 1/2/3 tổng hợp + phân bổ theo cơ sở ─────── */
  const handleExcel = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const fileName = await exportToExcel({
        fileName: `ecometric-carbon-${period}`,
        sheets: buildCarbonSheets({
          scopes: SCOPES,
          scopeData,
          periodLabel: PERIOD_LABEL[period].title,
          sites: SITES,
          siteMatrix: SITE_MATRIX[period],
        }),
      });
      setMsg(`Đã xuất dữ liệu Excel: ${fileName}`);
    } catch (err) {
      setMsg(`Lỗi xuất Excel: ${err?.message ?? "không xác định"}`);
    } finally {
      setBusy(false);
    }
  };

  /* ── Tải báo cáo PDF: toàn bộ bảng chỉ số Scope 1/2/3 ──────────── */
  const handlePdf = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const fileName = await exportToPdf({
        fileName: `ecometric-carbon-${period}`,
        title: "BAO CAO PHAT THAI CARBON",
        subtitle:
          "EcoMetric - Kiem ke khi nha kinh theo GHG Protocol (Scope 1 / 2 / 3)",
        meta: [
          `Moc thoi gian: ${PERIOD_LABEL[period].title}`,
          `Tong phat thai: ${total.toLocaleString("vi-VN")} tan CO2e`,
          `So co so: ${SITES.length}`,
          `Ngay ket xuat: ${new Date().toLocaleString("vi-VN")}`,
        ],
        tables: buildCarbonPdfTables({
          scopes: SCOPES,
          scopeData,
          sites: SITES,
          siteMatrix: SITE_MATRIX[period],
        }),
      });
      setMsg(`Đã tải báo cáo PDF: ${fileName}`);
    } catch (err) {
      setMsg(`Lỗi xuất PDF: ${err?.message ?? "không xác định"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-73px)] min-w-0 flex-1 flex-col gap-5 p-4 pb-24 sm:gap-6 sm:p-6 lg:pb-6">
      {/* Tiêu đề trang + bộ lọc thời gian */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-[6px]">
          <h1 className="text-[20px] font-extrabold leading-tight text-[#0f172a] sm:text-[24px]">
            Phát thải carbon
          </h1>
          <p className="text-[13px] leading-snug text-[#64748b] sm:text-[14px]">
            Kiểm kê khí nhà kính theo GHG Protocol ·{" "}
            {PERIOD_LABEL[period].title} · Tổng{" "}
            <b className="text-[#0f172a]">{fmt(total)} tấn CO2e</b>
          </p>
          {msg && (
            <p className="text-[11px] font-semibold text-[#059669]">{msg}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className={LABEL}>
            <CalendarRange size={13} strokeWidth={2.4} /> Mốc thời gian
          </span>
          <PeriodFilter value={period} onChange={setPeriod} />

          <button type="button" onClick={handleExcel} disabled={busy} className={BTN_GHOST}>
            <FileSpreadsheet size={15} strokeWidth={2.4} />
            Xuất dữ liệu Excel
          </button>
          <button type="button" onClick={handlePdf} disabled={busy} className={BTN_PRIMARY}>
            <Download size={15} strokeWidth={2.6} />
            {busy ? "Đang kết xuất…" : "Tải báo cáo PDF"}
          </button>
        </div>
      </div>

      {/* Thẻ tổng quan theo Scope 1 / 2 / 3 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SCOPES.map((s) => (
          <ScopeCard
            key={s.id}
            scope={s}
            value={scopeData[s.id].value}
            prev={scopeData[s.id].prev}
            target={scopeData[s.id].target}
          />
        ))}
      </div>

      {/* Biểu đồ xu hướng + panel lộ trình Net Zero */}
      <div className="flex flex-col items-stretch gap-5 xl:flex-row">
        <EmissionsTrendChart period={period} />
        <NetZeroPanel period={period} />
      </div>

      {/* Bản đồ nhiệt phân bổ theo nhà xưởng / chi nhánh */}
      <HeatmapCard period={period} />
    </main>
  );
}
