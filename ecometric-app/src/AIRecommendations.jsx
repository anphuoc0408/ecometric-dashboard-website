/**
 * EcoMetric – Màn hình 4: Khuyến nghị AI
 * Phong cách: Apple "iOS Liquid Glass" (glass / glass-press từ index.css)
 *
 * Stack: React + Tailwind CSS v4 + lucide-react
 * Gồm 4 khối chính:
 *   1. Dải chỉ số tổng hợp tiềm năng (giảm CO2e, chi phí, ROI, số giải pháp)
 *   2. Bộ lọc theo mức ưu tiên (Cao / Trung bình / Thấp) + theo lĩnh vực (Điện năng / Nhiên liệu / Quy trình)
 *   3. Danh sách Solution Card có thể hành động (số liệu CAPEX / tiết kiệm / payback / ROI)
 *   4. Modal Action Plan: quy trình 5 bước + bảng so sánh KPI Trước → Sau
 *   5. Panel phụ: cách AI xếp hạng ưu tiên + tiến độ xử lý khuyến nghị
 */
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  CalendarClock,
  Check,
  CircleCheckBig,
  CircleSlash,
  ClipboardList,
  Clock,
  Cpu,
  Droplets,
  Filter,
  Flame,
  Gauge,
  Info,
  Layers,
  Leaf,
  Lightbulb,
  RefreshCw,
  Recycle,
  Settings2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";

/* ────────────────────────────────
   0. HÀM ĐỊNH DẠNG DÙNG CHUNG
   Khai báo bằng `function` (hoisted) để có thể dùng an toàn ở BẤT KỲ
   vị trí nào trong module – kể cả trong các mảng dữ liệu phía dưới.
   Tránh lỗi Temporal Dead Zone (TDZ) như đã từng xảy ra ở App.jsx.
   ──────────────────────────────── */
// Chuẩn hoá mọi giá trị đầu vào về số hữu hạn.
// Trả về 0 khi giá trị là undefined / null / NaN / Infinity hoặc chuỗi không phải số.
function num(value, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fmt(n, digits = 1) {
  return num(n).toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtInt(n) {
  return num(n).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

// Rút gọn chi phí: 15,00 triệu VNĐ / 2,85 tỷ VNĐ
function fmtMoney(n) {
  const v = num(n);
  if (v >= 1_000_000_000) return `${fmt(v / 1_000_000_000, 2)} tỷ VNĐ`;
  if (v >= 1_000_000) return `${fmt(v / 1_000_000, 2)} triệu VNĐ`;
  return `${fmtInt(v)} VNĐ`;
}

// Số thập phân theo số chữ số mong muốn: 12,818
function fmtDec(n, digits = 3) {
  return num(n).toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// Chênh lệch tuyệt đối kèm dấu: −1.056 hoặc +0,712
function fmtDelta(n, digits = 0) {
  const v = num(n);
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmtDec(Math.abs(v), digits)}`;
}

// % chênh lệch giữa sau và trước (an toàn với chia cho 0 / NaN)
function pctChange(after, before) {
  const b = num(before);
  if (b === 0) return 0;
  return num(((num(after) - b) / b) * 100, 0);
}

// KPI "tốt hơn" khi giảm hay khi tăng
function isImproved(row) {
  const before = num(row.before);
  const after = num(row.after);
  return row.better === "lower" ? after < before : after > before;
}

/* ────────────────────────────────
   1. DESIGN TOKENS (kế thừa bảng màu của Dashboard & Phát thải carbon)
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
const LABEL = "flex items-center gap-[6px] text-[12px] font-semibold text-[#64748b]";

// Nút hành động chính (kính xanh đặc) & nút phụ (kính trong)
const BTN_PRIMARY =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#10b981] px-4 py-[10px] " +
  `text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] ${FOCUS}`;
const BTN_GHOST =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-4 py-[10px] " +
  `text-[13px] font-semibold text-[#0f172a] backdrop-blur-[12px] transition-all hover:bg-white active:scale-[0.98] ${FOCUS}`;

/* ────────────────────────────────
   2. DỮ LIỆU MẪU (thay bằng API sau này)
   ──────────────────────────────── */

/* — Phân loại mức độ ưu tiên — */
const PRIORITIES = [
  { id: "high", label: "Ưu tiên cao", short: "Cao", color: COLOR.red, bg: "bg-[#fee2e2]", text: "text-[#991b1b]" },
  { id: "medium", label: "Ưu tiên trung bình", short: "Trung bình", color: COLOR.amber, bg: "bg-[#fef3c7]", text: "text-[#b45309]" },
  { id: "low", label: "Ưu tiên thấp", short: "Thấp", color: COLOR.blue, bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
];
const PRIORITY_BY_ID = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]));

/* — Lĩnh vực áp dụng — */
const DOMAINS = [
  { id: "power", label: "Điện năng", icon: Zap, color: COLOR.emerald },
  { id: "fuel", label: "Nhiên liệu", icon: Flame, color: COLOR.amber },
  { id: "process", label: "Quy trình", icon: Settings2, color: COLOR.violet },
];
const DOMAIN_BY_ID = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));

/* — Trạng thái xử lý của từng khuyến nghị — */
const STATUS_META = {
  applied: { label: "Đã áp dụng", bg: "bg-[#10b981]/14", text: "text-[#059669]", icon: CircleCheckBig },
  planned: { label: "Đã lên kế hoạch", bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", icon: CalendarClock },
  new: { label: "Chờ xử lý", bg: "bg-white/70", text: "text-[#64748b]", icon: Sparkles },
};

/* — Danh sách khuyến nghị do AI đề xuất —
     patience : số hiệu giải pháp để hiển thị "ƯU TIÊN 01" (không dùng index mảng,
                giữ nguyên khi bộ lọc thay đổi thứ tự)
     reduction: tấn CO2e giảm được mỗi năm
     cost     : chi phí đầu tư dự kiến (VNĐ)
     roi      : thời gian hoàn vốn (tháng)
     confidence: độ tin cậy của mô hình (%)
     actionPlan: dữ liệu cho Modal Action Plan (chỉ giải pháp đã có kế hoạch chi tiết)  */

/* — Kịch bản gốc của giải pháp trọng tâm "ƯU TIÊN 01" —
     Thay 100 bóng đèn huỳnh quang 40W bằng LED 18W tại Xưởng 1.
     Hệ số phát thải lưới điện VN 2024: 0,6766 kg CO2e/kWh.         */
const LED_RETROFIT_CASE = {
  title: "Thay 100 bóng đèn huỳnh quang 40W bằng LED 18W tại Xưởng 1",
  desc: "Hoán cải hệ thống chiếu sáng Xưởng 1 từ 100 bóng huỳnh quang T8 40W sang LED tuýp 18W, giữ nguyên máng và hệ thống dây hiện hữu.",
  evidence:
    "Điện năng Xưởng 1 chiếm 40% phát thải toàn nhà máy và đã tăng 12% trong 3 tháng gần nhất.",
  priority: "high",
  domain: "power",
  scope: "Scope 2",
  site: "Xưởng 1",
  level: "Cấp Xưởng",
  duration: "Hoàn thành trong 7 ngày",
  capex: 15_000_000,
  savingMonth: 2_640_000,
  savingYear: 31_680_000,
  kwhMonth: 1_056,
  reductionMonth: 0.714,
  reductionYear: 8.573,
  payback: 5.7,
  roiYear1: 111.2,
  gridFactor: 0.6766,
  kwhYear: 12_672,
  confidence: 96,
  status: "new",
};

const RECOMMENDATIONS = [
  {
    id: "AI-01",
    patience: 1,
    ...LED_RETROFIT_CASE,
    icon: Lightbulb,
    /* Quy trình 5 bước triển khai */
    steps: [
      { no: 1, task: "Khảo sát hiện trạng & đo đạc độ rọi Xưởng 1", owner: "Kỹ thuật Xưởng 1", due: "05/11/2025", status: "done" },
      { no: 2, task: "Lập danh mục vật tư, báo giá 100 bộ LED tuýp 18W", owner: "Ban Thu mua", due: "07/11/2025", status: "done" },
      { no: 3, task: "Phê duyệt CAPEX 15.000.000 VNĐ", owner: "Ban Giám đốc", due: "10/11/2025", status: "processing" },
      { no: 4, task: "Thi công thay thế 100 bóng, theo từng khu vực", owner: "Đội Cơ điện", due: "18/11/2025", status: "pending" },
      { no: 5, task: "Nghiệm thu, đo lại độ rọi & chốt số kWh tiết kiệm", owner: "Ban Năng lượng", due: "21/11/2025", status: "pending" },
    ],
    /* Bảng so sánh KPI trước / sau */
    kpi: {
      rows: [
        { label: "Điện năng tiêu thụ Xưởng 1", unit: "kWh/tháng", before: 20_000, after: 18_944, better: "lower" },
        { label: "Phát thải từ chiếu sáng Xưởng 1", unit: "tCO2e/tháng", before: 13.53, after: 12.818, better: "lower" },
        { label: "Công suất chiếu sáng", unit: "kW", before: 4.0, after: 1.8, better: "lower" },
        { label: "Chi phí điện chiếu sáng", unit: "VNĐ/tháng", before: 50_000_000, after: 47_360_000, better: "lower" },
      ],
    },
  },
  {
    id: "AI-02",
    title: "Thay lò hơi dầu DO bằng lò hơi điện phân",
    desc: "Chuyển hệ thống gia nhiệt sấy vải sang lò hơi điện công suất 3 t/h, loại bỏ phát thải đốt nhiên liệu trực tiếp.",
    priority: "high",
    domain: "fuel",
    scope: "Scope 1",
    site: "Nhà máy B – May mặc",
    reduction: 142.8,
    cost: 1_960_000_000,
    roi: 31,
    confidence: 89,
    status: "planned",
  },
  {
    id: "AI-03",
    title: "Biến tần & giám sát tải cho hệ motor nhuộm",
    desc: "Trang bị biến tần (VFD) cho 18 motor bơm – quạt, phối hợp quy tắc vận hành theo tải thực tế thay vì chạy nền.",
    priority: "high",
    domain: "power",
    scope: "Scope 2",
    site: "Nhà máy A – Dệt nhuộm",
    reduction: 74.2,
    cost: 612_000_000,
    roi: 11,
    confidence: 96,
    status: "new",
  },
  {
    id: "AI-04",
    title: "Thu hồi nhiệt thải từ nước nhuộm 60°C",
    desc: "Dùng bộ trao đổi nhiệt tấm để hồi nhiệt dòng nước thải nhuộm, cấp lại cho công đoạn giặt – tiết kiệm hơi đốt.",
    priority: "medium",
    domain: "process",
    scope: "Scope 1",
    site: "Nhà máy A – Dệt nhuộm",
    reduction: 58.9,
    cost: 480_000_000,
    roi: 14,
    confidence: 87,
    status: "new",
  },
  {
    id: "AI-05",
    title: "Điện khí hoá đội xe nâng & xe tải nhẹ",
    desc: "Thay 9 xe nâng dầu và 4 xe tải nhẹ bằng bản điện, kết hợp sạc ban đêm theo biểu giá thấp điểm.",
    priority: "medium",
    domain: "fuel",
    scope: "Scope 1",
    site: "Kho trung tâm – Logistics",
    reduction: 63.5,
    cost: 1_420_000_000,
    roi: 34,
    confidence: 82,
    status: "planned",
  },
  {
    id: "AI-06",
    title: "Chuyển đổi sang bao bì tái chế một lớp",
    desc: "Chuẩn hoá bao bì xuất khẩu về một lớp PE tái chế, giảm khối lượng vật liệu và phát thải từ nhà cung cấp bao bì.",
    priority: "medium",
    domain: "process",
    scope: "Scope 3",
    site: "Nhà máy B – May mặc",
    reduction: 47.3,
    cost: 265_000_000,
    roi: 9,
    confidence: 78,
    status: "applied",
  },
  {
    id: "AI-07",
    title: "Tái sử dụng nước ngưng & nước rửa cuối",
    desc: "Lắp vòng tuần hoàn nước ngưng cho hệ hơi và thu nước rửa cuối dòng để tái dùng cho công đoạn tiền xử lý.",
    priority: "medium",
    domain: "process",
    scope: "Scope 2",
    site: "Nhà máy C – Xử lý nước",
    reduction: 39.6,
    cost: 198_000_000,
    roi: 8,
    confidence: 91,
    status: "new",
  },
  {
    id: "AI-08",
    title: "Chuyển logistics thuê ngoài sang xe tải điện",
    desc: "Đàm phán lại hợp đồng vận tải: ưu tiên nhà xe dùng xe tải điện cho 40% tuyến nội địa, ghi nhận giảm Scope 3.",
    priority: "low",
    domain: "fuel",
    scope: "Scope 3",
    site: "Toàn hệ thống",
    reduction: 34.1,
    cost: 320_000_000,
    roi: 18,
    confidence: 74,
    status: "new",
  },
  {
    id: "AI-09",
    title: "Dịch chuyển ph tải sang giờ thấp điểm",
    desc: "Tự động hoá lịch chạy máy nén khí và hệ làm lạnh sang khung 22h–5h, giảm hệ số phát thải biên của lưới điện.",
    priority: "low",
    domain: "power",
    scope: "Scope 2",
    site: "Toàn hệ thống",
    reduction: 28.7,
    cost: 96_000_000,
    roi: 5,
    confidence: 93,
    status: "planned",
  },
  {
    id: "AI-10",
    title: "Bù công suất phản kháng (tụ bù tự động)",
    desc: "Lắp tủ tụ bù tự động cho 4 tủ điện chính, nâng hệ số công suất lên 0,95 để giảm tổn thất và tiền phạt công suất.",
    priority: "low",
    domain: "power",
    scope: "Scope 2",
    site: "Nhà máy C – Xử lý nước",
    reduction: 16.2,
    cost: 74_000_000,
    roi: 4,
    confidence: 97,
    status: "applied",
  },
];

const SCORE_METHOD = [
  { icon: Gauge, title: "Tác động phát thải", desc: "Mức giảm tấn CO2e/năm quy về mốc cơ sở 2021" },
  { icon: Wallet, title: "Hiệu quả chi phí", desc: "Chi phí trên mỗi tấn CO2e giảm được" },
  { icon: BatteryCharging, title: "Khả thi kỹ thuật", desc: "Mức can thiệp vào dây chuyền đang vận hành" },
  { icon: CalendarClock, title: "Thời gian hoàn vốn", desc: "Số tháng thu hồi vốn theo dòng tiền tiết kiệm" },
];

/* ────────────────────────────────
   3. HÀM TIỆN ÍCH
   Các hàm định dạng (fmt, fmtInt, fmtMoney, fmtDec, fmtDelta,
   pctChange, isImproved) đã được chuyển lên đầu file (mục 0)
   dưới dạng hoisted function declaration.
   ──────────────────────────────── */

// Lọc theo mức ưu tiên (nhận 1 id hoặc mảng id)
const matchPriority = (item, priorities) =>
  priorities === "all" || (Array.isArray(priorities) ? priorities.includes(item.priority) : item.priority === priorities);

/* Chuẩn hoá một khuyến nghị về đúng "hình dạng" số liệu mà UI mong đợi.
   Dữ liệu thô có thể dùng tên trường khác nhau (co2/co2Saved, cost/capex,
   roi/payback) hoặc thiếu trường → luôn quy về số hữu hạn để tránh NaN. */
const normalizeItem = (raw) => {
  const reductionYear = num(raw.reductionYear ?? raw.reduction ?? raw.co2Saved ?? raw.co2, 0);
  const reductionMonth = num(raw.reductionMonth ?? reductionYear / 12, 0);
  const cost = num(raw.cost ?? raw.capex, 0);
  const roi = num(raw.roi ?? raw.payback, 0);

  return {
    ...raw,
    reduction: reductionYear,
    reductionYear,
    reductionMonth,
    cost,
    capex: num(raw.capex ?? cost, 0),
    roi,
    payback: num(raw.payback ?? roi, 0),
    confidence: num(raw.confidence, 0),
    savingMonth: num(raw.savingMonth, 0),
    savingYear: num(raw.savingYear, 0),
    kwhMonth: num(raw.kwhMonth, 0),
    kwhYear: num(raw.kwhYear, 0),
    gridFactor: num(raw.gridFactor, 0),
    roiYear1: num(raw.roiYear1, 0),
    patience: num(raw.patience, 0),
  };
};

/* ────────────────────────────────
   4. THÀNH PHẦN GIAO DIỄN
   ──────────────────────────────── */

/* ── Dải chỉ số tổng hợp tiềm năng ──────────────────────────── */
function SummaryCard({ icon: Icon, label, value, unit, accent, note }) {
  return (
    <article className={`${GLASS} relative flex min-w-0 flex-col gap-3 overflow-hidden p-5`}>
      <span className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-[#64748b]">{label}</p>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
          style={{ backgroundColor: `${accent}1f` }}
        >
          <Icon size={17} strokeWidth={2.2} color={accent} />
        </span>
      </div>
      <p className="text-[22px] font-extrabold leading-tight text-[#0f172a]">
        {value} {unit && <span className="text-[13px] font-semibold text-[#64748b]">{unit}</span>}
      </p>
      <p className="text-[12px] text-[#94a3b8]">{note}</p>
    </article>
  );
}

/* ── Nhãn minh bạch nguồn số liệu ────────────────────────────────
     Thay cho nhãn "ĐẠT CHUẨN XANH": nêu rõ số liệu là mô phỏng
     theo hệ số lưới điện Việt Nam 2024.                          */
function DataProvenanceTag() {
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full bg-[#dbeafe] px-[10px] py-[4px] text-[11px] font-semibold text-[#1d4ed8]">
      <Info size={12} strokeWidth={2.6} />
      Dữ liệu mô phỏng theo Hệ số Lưới điện VN 2024
    </span>
  );
}

/* ── Trạng thái bước triển khai trong Action Plan ─────────────── */
const STEP_STATUS = {
  done: { label: "Hoàn thành", bg: "bg-[#10b981]/14", text: "text-[#059669]", icon: CircleCheckBig },
  processing: { label: "Đang thực hiện", bg: "bg-[#fef3c7]", text: "text-[#b45309]", icon: Clock },
  pending: { label: "Chưa bắt đầu", bg: "bg-white/70", text: "text-[#64748b]", icon: CircleSlash },
};

/* ── Bộ lọc theo mức ưu tiên (segmented control kiểu iOS) ─────── */
function PriorityFilter({ value, onChange, counts }) {
  const tabs = [{ id: "all", label: "Tất cả", color: COLOR.emeraldDark }, ...PRIORITIES];

  return (
    <div
      role="radiogroup"
      aria-label="Mức độ ưu tiên"
      className="glass-press inline-flex flex-wrap items-center gap-1 rounded-full border border-white/60 bg-white/45 p-1 backdrop-blur-[16px]"
    >
      {tabs.map(({ id, label, color }) => {
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
                ? "text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.85)]"
                : "text-[#64748b] hover:bg-white/70 hover:text-[#0f172a]"
            }`}
            style={active ? { backgroundColor: id === "all" ? COLOR.emerald : color } : undefined}
          >
            {label}
            <span
              className={`rounded-full px-[7px] py-[1px] text-[11px] ${
                active ? "bg-white/25 text-white" : "bg-white/70 text-[#64748b]"
              }`}
            >
              {counts[id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Bộ lọc theo lĩnh vực ─────────────────────────────────────── */
function DomainFilter({ value, onChange, counts }) {
  const tabs = [{ id: "all", label: "Tất cả lĩnh vực", icon: Layers, color: COLOR.emeraldDark }, ...DOMAINS];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`${LABEL} mr-1`}>
        <Filter size={13} strokeWidth={2.4} /> Lĩnh vực
      </span>
      {tabs.map(({ id, label, icon: Icon, color }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`glass-press flex items-center gap-2 rounded-full border px-[14px] py-[6px] text-[12px] font-semibold transition-all ${FOCUS} ${
              active
                ? "border-transparent bg-[#10b981] text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.8)]"
                : "border-white/60 bg-white/50 text-[#64748b] hover:bg-white/80"
            }`}
          >
            <Icon size={13} strokeWidth={2.6} color={active ? "#ffffff" : color} />
            {label}
            <span
              className={`rounded-full px-[6px] py-[1px] text-[10px] ${
                active ? "bg-white/25 text-white" : "bg-white/70 text-[#94a3b8]"
              }`}
            >
              {counts[id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Solution Card: thẻ giải pháp có thể hành động ───────────── */
function SolutionCard({ item, onApply, onPlan, onOpenPlan }) {
  const priority = PRIORITY_BY_ID[item.priority];
  const domain = DOMAIN_BY_ID[item.domain];
  const status = STATUS_META[item.status];
  const StatusIcon = status.icon;
  const DomainIcon = domain.icon;
  const hasPlan = Boolean(item.steps?.length);

  return (
    <article className={`${GLASS} relative flex flex-col gap-4 overflow-hidden p-5`}>
      {/* Vệt màu nhận diện mức ưu tiên */}
      <span className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: priority.color }} />

      {/* Hàng đầu: số hiệu ưu tiên + nhãn + độ tin cậy */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-bold uppercase"
              style={{ backgroundColor: `${priority.color}1f`, color: priority.color }}
            >
              <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: priority.color }} />
              Ưu tiên {String(item.patience ?? 0).padStart(2, "0")}
            </span>
            <span
              className="inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold"
              style={{ backgroundColor: `${domain.color}1f`, color: domain.color }}
            >
              <DomainIcon size={12} strokeWidth={2.6} />
              {domain.label}
            </span>
            <span className="rounded-full bg-white/70 px-[10px] py-[4px] text-[11px] font-semibold text-[#64748b]">
              {item.scope}
            </span>
          </div>

          <h3 className="text-[15px] font-bold text-[#0f172a]">{item.title}</h3>
          <p className="text-[12px] leading-[1.5] text-[#64748b]">{item.desc}</p>
        </div>

        <span className="flex shrink-0 flex-col items-end gap-[6px]">
          <span className="rounded-full bg-white/70 px-3 py-[4px] text-[11px] font-semibold text-[#64748b]">
            {item.id}
          </span>
          <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-[#059669]">
            <BadgeCheck size={13} strokeWidth={2.4} />
            Tin cậy {item.confidence}%
          </span>
        </span>
      </div>

      {/* Căn cứ dữ liệu */}
      {item.evidence && (
        <p className="flex items-start gap-2 rounded-[14px] bg-[#fef3c7] px-4 py-3 text-[12px] leading-[1.5] text-[#b45309]">
          <Gauge size={14} strokeWidth={2.6} className="mt-[2px] shrink-0" />
          <span>
            <b>Căn cứ dữ liệu: </b>
            {item.evidence}
          </span>
        </p>
      )}

      {/* Bốn chỉ số kinh tế – kỹ thuật */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-[3px] rounded-[14px] bg-white/55 px-4 py-3">
          <span className="inline-flex items-center gap-[6px] text-[11px] font-semibold text-[#64748b]">
            <Wallet size={13} strokeWidth={2.6} color={COLOR.blue} />
            Chi phí đầu tư (CAPEX)
          </span>
          <span className="text-[16px] font-extrabold text-[#0f172a]">{fmtMoney(item.cost)}</span>
          <span className="text-[10px] text-[#94a3b8]">{fmtInt(item.cost)} VNĐ</span>
        </div>

        <div className="flex flex-col gap-[3px] rounded-[14px] bg-white/55 px-4 py-3">
          <span className="inline-flex items-center gap-[6px] text-[11px] font-semibold text-[#64748b]">
            <TrendingDown size={13} strokeWidth={2.6} color={COLOR.emeraldDark} />
            Tiết kiệm chi phí
          </span>
          <span className="text-[16px] font-extrabold text-[#0f172a]">{fmtMoney(item.savingMonth)}/tháng</span>
          <span className="text-[10px] text-[#94a3b8]">{fmtMoney(item.savingYear)}/năm</span>
        </div>

        <div className="flex flex-col gap-[3px] rounded-[14px] bg-white/55 px-4 py-3">
          <span className="inline-flex items-center gap-[6px] text-[11px] font-semibold text-[#64748b]">
            <Leaf size={13} strokeWidth={2.6} color={COLOR.emeraldDark} />
            Giảm phát thải
          </span>
          <span className="text-[16px] font-extrabold text-[#0f172a]">
            {fmtDec(item.reductionMonth, 3)} <span className="text-[11px] font-semibold text-[#64748b]">tCO₂e/tháng</span>
          </span>
          <span className="text-[10px] text-[#94a3b8]">{fmtDec(item.reductionYear, 3)} tCO₂e/năm</span>
        </div>

        <div className="flex flex-col gap-[3px] rounded-[14px] bg-white/55 px-4 py-3">
          <span className="inline-flex items-center gap-[6px] text-[11px] font-semibold text-[#64748b]">
            <RefreshCw size={13} strokeWidth={2.6} color={COLOR.violet} />
            Hoàn vốn (Payback)
          </span>
          <span className="text-[16px] font-extrabold text-[#0f172a]">
            {fmtDec(item.roi, 1)} <span className="text-[11px] font-semibold text-[#64748b]">tháng</span>
          </span>
          <span className="text-[10px] text-[#94a3b8]">Simple ROI năm 1: {fmtDec(item.roiYear1, 1)}%</span>
        </div>
      </div>

      {/* Cơ sở tính toán */}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[14px] bg-white/45 px-4 py-3 text-[11px] text-[#64748b]">
        <span className="inline-flex items-center gap-[6px] font-semibold text-[#0f172a]">
          <Info size={13} strokeWidth={2.6} color={COLOR.emeraldDark} /> Cơ sở tính:
        </span>
        <span>
          <b className="text-[#0f172a]">{fmtInt(item.kwhMonth)} kWh</b> tiết kiệm/tháng
        </span>
        <span className="text-[#cbd5e1]">·</span>
        <span>
          <b className="text-[#0f172a]">{fmtInt(item.kwhYear)} kWh</b>/năm
        </span>
        <span className="text-[#cbd5e1]">·</span>
        <span>
          Hệ số lưới điện <b className="text-[#0f172a]">{fmtDec(item.gridFactor, 4)} kg CO₂e/kWh</b>
        </span>
        <DataProvenanceTag />
      </p>

      {/* Chân thẻ: địa điểm + cấp triển khai + trạng thái + nút hành động */}
      <div className="flex flex-col gap-3 border-t border-white/60 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {item.level && (
              <span className="inline-flex items-center gap-[6px] rounded-full bg-white/70 px-[10px] py-[4px] text-[11px] font-semibold text-[#64748b]">
                <Layers size={12} strokeWidth={2.6} />
                {item.level} · {item.duration}
              </span>
            )}
            <span className="text-[11px] text-[#94a3b8]">Áp dụng cho: {item.site}</span>
          </div>
          <span
            className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${status.bg} ${status.text}`}
          >
            <StatusIcon size={12} strokeWidth={2.6} />
            {status.label}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => onApply(item)} className={BTN_PRIMARY}>
            <Check size={15} strokeWidth={2.8} />
            Áp dụng ngay
          </button>
          <button type="button" onClick={() => onPlan(item)} className={BTN_GHOST}>
            <CalendarClock size={15} strokeWidth={2.4} />
            Lên kế hoạch
          </button>
          {hasPlan && (
            <button type="button" onClick={() => onOpenPlan(item)} className={BTN_GHOST}>
              <ClipboardList size={15} strokeWidth={2.4} />
              Xem cách triển khai
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Modal Action Plan: quy trình 5 bước + so sánh KPI ─────────── */
function ActionPlanModal({ item, onClose, onApply, onPlan }) {
  if (!item) return null;

  const steps = item.steps ?? [];
  const kpiRows = item.kpi?.rows ?? [];
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0f172a]/35 p-4 backdrop-blur-[6px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-plan-title"
      onClick={onClose}
    >
      <div
        className="glass my-auto flex w-full max-w-[900px] flex-col gap-5 p-6 shadow-[0_28px_70px_-20px_rgba(15,23,42,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Đầu modal */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-[6px] rounded-full bg-[#10b981]/14 px-[10px] py-[4px] text-[11px] font-bold text-[#059669]">
                <ClipboardList size={12} strokeWidth={2.6} />
                Action Plan · {item.id}
              </span>
              <DataProvenanceTag />
            </div>
            <h2 id="action-plan-title" className="text-[18px] font-extrabold leading-snug text-[#0f172a]">
              {item.title}
            </h2>
            <p className="text-[12px] text-[#64748b]">
              Cấp độ triển khai: <b className="text-[#0f172a]">{item.level}</b> · {item.duration} · CAPEX{" "}
              <b className="text-[#0f172a]">{fmtInt(item.cost)} VNĐ</b>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng Action Plan"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#64748b] transition-all hover:bg-white hover:text-[#0f172a] ${FOCUS}`}
          >
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>

        {/* Tiến độ 5 bước */}
        <div className="flex flex-col gap-[6px]">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[#64748b]">
              Tiến độ: {doneCount}/{steps.length} bước hoàn thành
            </span>
            <span className="text-[#059669]">{progress}%</span>
          </div>
          <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${progress}%`, backgroundColor: COLOR.emerald }}
            />
          </div>
        </div>

        {/* 1. Quy trình 5 bước */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[13px] font-bold text-[#0f172a]">Quy trình triển khai 5 bước</h3>
          <ul className="flex flex-col gap-2">
            {steps.map(({ no, task, owner, due, status }) => {
              const meta = STEP_STATUS[status];
              const StatusIcon = meta.icon;
              const done = status === "done";
              return (
                <li
                  key={no}
                  className="flex flex-wrap items-center gap-3 rounded-[14px] border border-white/60 bg-white/55 px-4 py-3"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                      done ? "bg-[#10b981] text-white" : "bg-white/80 text-[#64748b]"
                    }`}
                  >
                    {done ? <Check size={14} strokeWidth={3} /> : no}
                  </span>

                  <div className="flex min-w-[220px] flex-1 flex-col gap-[2px]">
                    <span className="text-[13px] font-semibold leading-[1.4] text-[#0f172a]">{task}</span>
                    <span className="text-[11px] text-[#94a3b8]">Bước {no}/5</span>
                  </div>

                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[10px] text-[#94a3b8]">Người phụ trách</span>
                    <span className="text-[12px] font-semibold text-[#0f172a]">{owner}</span>
                  </div>

                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[10px] text-[#94a3b8]">Hạn hoàn thành</span>
                    <span className="text-[12px] font-semibold text-[#0f172a]">{due}</span>
                  </div>

                  <span
                    className={`inline-flex w-[140px] shrink-0 items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${meta.bg} ${meta.text}`}
                  >
                    <StatusIcon size={12} strokeWidth={2.6} />
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 2. Bảng so sánh KPI Trước → Sau */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[13px] font-bold text-[#0f172a]">Bảng so sánh KPI: Trước → Sau</h3>
            <span className="inline-flex items-center gap-[6px] rounded-full bg-[#dbeafe] px-[10px] py-[4px] text-[11px] font-semibold text-[#1d4ed8]">
              <Info size={12} strokeWidth={2.6} />
              Hệ số 0,6766 kg CO₂e/kWh
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="flex items-center gap-3 rounded-t-[14px] border border-white/60 bg-white/55 px-4 py-[10px] text-[12px] font-semibold text-[#64748b] backdrop-blur-[12px]">
                <span className="min-w-[220px] flex-1">Chỉ số KPI</span>
                <span className="w-[150px] shrink-0 text-right">Trước</span>
                <span className="w-[150px] shrink-0 text-right">Sau</span>
                <span className="w-[150px] shrink-0 text-right">Chênh lệch</span>
              </div>

              {kpiRows.map((row, idx) => {
                const delta = row.after - row.before;
                const pct = pctChange(row.after, row.before);
                const good = isImproved(row);
                const digits = Math.abs(row.before) >= 1000 ? 0 : 3;

                return (
                  <div
                    key={row.label}
                    className={`flex items-center gap-3 border-x border-b border-white/60 px-4 py-[12px] transition-colors hover:bg-white/70 ${
                      idx === kpiRows.length - 1 ? "rounded-b-[14px]" : ""
                    }`}
                  >
                    <div className="flex min-w-[220px] flex-1 flex-col">
                      <span className="text-[13px] font-semibold text-[#0f172a]">{row.label}</span>
                      <span className="text-[11px] text-[#94a3b8]">{row.unit}</span>
                    </div>

                    <span className="w-[150px] shrink-0 text-right text-[13px] font-semibold text-[#94a3b8]">
                      {fmtDec(row.before, digits)}
                    </span>

                    <span className="w-[150px] shrink-0 text-right text-[13px] font-bold text-[#0f172a]">
                      {fmtDec(row.after, digits)}
                    </span>

                    <span className="flex w-[150px] shrink-0 justify-end">
                      <span
                        className={`inline-flex items-center gap-[5px] rounded-full px-[10px] py-[4px] text-[11px] font-bold ${
                          good ? "bg-[#10b981]/12 text-[#059669]" : "bg-[#fee2e2] text-[#991b1b]"
                        }`}
                      >
                        {good ? <TrendingDown size={12} strokeWidth={3} /> : <TrendingUp size={12} strokeWidth={3} />}
                        {fmtDelta(delta, digits)} ({fmtDec(pct, 1)}%)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chân modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-4">
          <span className="max-w-[520px] text-[11px] leading-[1.5] text-[#94a3b8]">
            Quy trình và số liệu KPI là bản mô phỏng theo Hệ số Lưới điện VN 2024, dùng để lập kế hoạch nội bộ.
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onClose} className={BTN_GHOST}>
              Đóng
            </button>
            <button type="button" onClick={() => onPlan(item)} className={BTN_GHOST}>
              <CalendarClock size={15} strokeWidth={2.4} />
              Lên kế hoạch
            </button>
            <button type="button" onClick={() => onApply(item)} className={BTN_PRIMARY}>
              <Check size={15} strokeWidth={2.8} />
              Áp dụng ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Panel phụ: cách AI xếp hạng + tiến độ xử lý ─────────────── */
function InsightPanel({ items, onReset }) {
  const total = items.length;

  const counts = useMemo(() => {
    const base = { high: 0, medium: 0, low: 0 };
    RECOMMENDATIONS.forEach((r) => {
      base[r.priority] += 1;
    });
    return base;
  }, []);

  const statusCounts = useMemo(() => {
    const base = { applied: 0, planned: 0, new: 0 };
    RECOMMENDATIONS.forEach((r) => {
      base[r.status] += 1;
    });
    return base;
  }, []);

  const totalReduction = RECOMMENDATIONS.reduce((s, r) => s + num(r.reductionYear ?? r.reduction), 0);

  return (
    <section className={`${GLASS} flex w-full shrink-0 flex-col gap-5 p-5 xl:w-[400px]`}>
      <div className="flex items-center gap-2">
        <Cpu size={18} strokeWidth={2.2} color={COLOR.emeraldDark} />
        <h2 className="text-[15px] font-bold text-[#0f172a]">AI xếp hạng ưu tiên như thế nào?</h2>
      </div>

      <ul className="flex flex-col gap-2">
        {SCORE_METHOD.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex items-start gap-3 rounded-[14px] bg-white/55 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#10b981]/12">
              <Icon size={15} strokeWidth={2.2} color={COLOR.emeraldDark} />
            </span>
            <div className="flex min-w-0 flex-col gap-[2px]">
              <span className="text-[13px] font-semibold text-[#0f172a]">{title}</span>
              <span className="text-[11px] leading-[1.45] text-[#64748b]">{desc}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Phân bố theo mức ưu tiên */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[13px] font-bold text-[#0f172a]">Phân bố theo mức ưu tiên</h3>
        <div className="flex h-[10px] w-full overflow-hidden rounded-full">
          {PRIORITIES.map((p) => (
            <span
              key={p.id}
              style={{ width: `${(counts[p.id] / RECOMMENDATIONS.length) * 100}%`, backgroundColor: p.color }}
              title={`${p.label}: ${counts[p.id]} giải pháp`}
            />
          ))}
        </div>
        <ul className="flex flex-col gap-[6px]">
          {PRIORITIES.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="h-[10px] w-[10px] shrink-0 rounded-[3px]" style={{ backgroundColor: p.color }} />
              <span className="flex-1 text-[12px] font-medium text-[#0f172a]">{p.label}</span>
              <span className="whitespace-nowrap text-[12px] font-semibold text-[#64748b]">{counts[p.id]} giải pháp</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tiến độ xử lý khuyến nghị */}
      <div className="flex flex-col gap-3 rounded-[16px] bg-[#10b981]/12 px-4 py-4">
        <div className="flex items-center gap-2">
          <Leaf size={16} strokeWidth={2.4} color={COLOR.emeraldDark} />
          <span className="text-[13px] font-bold text-[#059669]">Tiến độ xử lý khuyến nghị</span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-[2px]">
            <span className="text-[20px] font-extrabold text-[#0f172a]">
              {statusCounts.applied + statusCounts.planned}/{RECOMMENDATIONS.length}
            </span>
            <span className="text-[11px] text-[#64748b]">giải pháp đã đưa vào hành động</span>
          </div>
          <span className="text-right text-[11px] text-[#64748b]">
            Tiềm năng giảm
            <br />
            <b className="text-[13px] text-[#0f172a]">{fmt(totalReduction, 0)} tấn CO2e/năm</b>
          </span>
        </div>
        <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${((statusCounts.applied + statusCounts.planned) / RECOMMENDATIONS.length) * 100}%`,
              backgroundColor: COLOR.emeraldDark,
            }}
          />
        </div>
      </div>

      {/* Kết quả lọc hiện tại + nút đặt lại */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-4">
        <span className="inline-flex items-center gap-2 text-[12px] text-[#64748b]">
          <Info size={14} strokeWidth={2.4} color={COLOR.emeraldDark} />
          Đang hiển thị <b className="text-[#0f172a]">{total}</b> / {RECOMMENDATIONS.length} khuyến nghị
        </span>
        <button
          type="button"
          onClick={onReset}
          className={`inline-flex items-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-4 py-[8px] text-[12px] font-semibold text-[#0f172a] backdrop-blur-[12px] transition-all hover:bg-white active:scale-[0.98] ${FOCUS}`}
        >
          <RefreshCw size={14} strokeWidth={2.4} />
          Đặt lại bộ lọc
        </button>
      </div>
    </section>
  );
}

/* ────────────────────────────────
   5. TRANG KHUYẾN NGHỊ AI
   ──────────────────────────────── */
export default function AIRecommendations() {
  const [priority, setPriority] = useState("all");
  const [domain, setDomain] = useState("all");
  // Trạng thái cục bộ của từng khuyến nghị sau khi người dùng tác động
  const [actions, setActions] = useState({});
  const [toast, setToast] = useState(null);
  // Khuyến nghị đang mở Action Plan (null = modal đóng)
  const [planItem, setPlanItem] = useState(null);

  // Áp dụng trạng thái mới vào danh sách
  const items = useMemo(
    () =>
      RECOMMENDATIONS.map((r) => normalizeItem(actions[r.id] ? { ...r, status: actions[r.id] } : r)),
    [actions],
  );

  const priorityCounts = useMemo(() => {
    const base = { all: items.length, high: 0, medium: 0, low: 0 };
    items.forEach((r) => {
      base[r.priority] += 1;
    });
    return base;
  }, [items]);

  // Số lượng đếm theo lĩnh vực, tôn trọng bộ lọc ưu tiên đang chọn
  const domainCounts = useMemo(() => {
    const base = { all: 0, power: 0, fuel: 0, process: 0 };
    items
      .filter((r) => matchPriority(r, priority))
      .forEach((r) => {
        base.all += 1;
        base[r.domain] += 1;
      });
    return base;
  }, [items, priority]);

  const filtered = useMemo(
    () => items.filter((r) => matchPriority(r, priority) && (domain === "all" || r.domain === domain)),
    [items, priority, domain],
  );

  // Sắp xếp theo mức ưu tiên rồi tới mức giảm CO2e
  const ORDER = { high: 0, medium: 1, low: 2 };
  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => ORDER[a.priority] - ORDER[b.priority] || num(b.reduction) - num(a.reduction),
      ),
    [filtered],
  );

  const handleAction = (item, status, message) => {
    setActions((prev) => ({ ...prev, [item.id]: status }));
    setToast({ id: item.id, message });
    // TODO: gọi API lưu trạng thái khuyến nghị tại đây
  };

  // Mở Action Plan từ nút "Tạo Action Plan" / "Xem cách triển khai"
  const openPlan = (item) => setPlanItem(item);

  const resetFilters = () => {
    setPriority("all");
    setDomain("all");
    setToast(null);
  };

  // ── Tổng hợp số liệu cho 4 thẻ KPI summary ─────────────────────
  // Ép kiểu Number + mặc định 0 để không bao giờ cộng ra NaN/undefined
  const totalCo2 = sorted.reduce((acc, item) => acc + num(item.co2Saved ?? item.co2 ?? item.reduction), 0);
  const totalCapex = sorted.reduce((acc, item) => acc + num(item.capex ?? item.cost), 0);
  // Tổng có trọng số: payback × lượng CO2e giảm được
  const weightedPaybackSum = sorted.reduce(
    (acc, item) => acc + num(item.payback ?? item.roi) * num(item.co2Saved ?? item.co2 ?? item.reduction),
    0,
  );
  // Hoàn vốn bình quân gia quyền – chặn chia cho 0 hoặc NaN
  const avgPayback = totalCo2 > 0 ? num(weightedPaybackSum / totalCo2) : 0;
  // Chi phí mỗi tấn CO2e – chặn chia cho 0 hoặc NaN
  const costPerTon = totalCo2 > 0 ? num(totalCapex / totalCo2) : 0;

  // Giữ tên cũ để các chỗ khác trong file dùng lại an toàn
  const totalReduction = totalCo2;
  const totalCost = totalCapex;
  const avgRoi = avgPayback;

  // Giải pháp trọng tâm ƯU TIÊN 01 (lấy từ items để bám trạng thái sau khi tác động)
  const focusItem = items.find((r) => r.patience === 1);

  return (
    <main className="flex min-h-[calc(100vh-73px)] min-w-0 flex-1 flex-col gap-6 p-6">
      {/* Tiêu đề trang + thông báo hành động */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-[6px]">
          <h1 className="text-[24px] font-extrabold text-[#0f172a]">Khuyến nghị AI</h1>
          <p className="text-[14px] text-[#64748b]">
            Giải pháp tối ưu năng lượng &amp; phát thải do mô hình đề xuất · Xếp hạng theo mức độ ưu tiên, chi phí và ROI
          </p>
        </div>

        {toast && (
          <span className="glass inline-flex items-center gap-2 px-4 py-[10px] text-[12px] font-semibold text-[#059669]">
            <CircleCheckBig size={15} strokeWidth={2.6} />
            {toast.id}: {toast.message}
          </span>
        )}
      </div>

      {/* Nút mở Action Plan của giải pháp trọng tâm (ƯU TIÊN 01) */}
      {focusItem?.steps?.length > 0 && (
        <div className={`${GLASS} flex flex-wrap items-center justify-between gap-3 p-5`}>
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <span className="inline-flex items-center gap-[6px] text-[13px] font-bold text-[#0f172a]">
              <Lightbulb size={15} strokeWidth={2.4} color={COLOR.emeraldDark} />
              Ưu tiên 01 · {focusItem.title}
            </span>
            <span className="text-[11px] text-[#64748b]">
              {focusItem.evidence}
            </span>
          </div>
          <button type="button" onClick={() => openPlan(focusItem)} className={BTN_PRIMARY}>
            <ClipboardList size={15} strokeWidth={2.6} />
            Tạo Action Plan
          </button>
        </div>
      )}

      {/* Dải chỉ số tổng hợp theo bộ lọc hiện tại */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={TrendingDown}
          label="Tiềm năng giảm CO2e"
          value={fmt(totalCo2, 1)}
          unit="tấn/năm"
          accent={COLOR.emerald}
          note={`${sorted.length} giải pháp trong nhóm đang xem`}
        />
        <SummaryCard
          icon={Wallet}
          label="Tổng chi phí đầu tư"
          value={fmtMoney(totalCapex)}
          accent={COLOR.blue}
          note="Vốn đầu tư dự kiến cho nhóm đang chọn"
        />
        <SummaryCard
          icon={RefreshCw}
          label="Hoàn vốn bình quân"
          value={fmt(avgPayback, 1)}
          unit="tháng"
          accent={COLOR.violet}
          note="Bình quân gia quyền theo lượng CO2e giảm"
        />
        <SummaryCard
          icon={Recycle}
          label="Chi phí mỗi tấn CO2e"
          value={fmtMoney(costPerTon)}
          accent={COLOR.amber}
          note="Càng thấp thì hiệu quả đầu tư càng cao"
        />
      </div>

      {/* Bộ lọc mức ưu tiên + lĩnh vực */}
      <div className={`${GLASS} flex flex-col gap-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={LABEL}>
            <Droplets size={13} strokeWidth={2.4} /> Mức độ ưu tiên
          </span>
          <PriorityFilter value={priority} onChange={setPriority} counts={priorityCounts} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-4">
          <DomainFilter value={domain} onChange={setDomain} counts={domainCounts} />
          <span className="text-[11px] text-[#94a3b8]">
            {sorted.length} / {items.length} khuyến nghị phù hợp bộ lọc
          </span>
        </div>
      </div>

      {/* Danh sách thẻ khuyến nghị + panel phụ */}
      <div className="flex flex-col items-stretch gap-5 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {sorted.length === 0 ? (
            <div className={`${GLASS} flex flex-col items-center justify-center gap-3 p-10 text-center`}>
              <Sparkles size={26} strokeWidth={2} color={COLOR.muted} />
              <p className="text-[14px] font-semibold text-[#0f172a]">Không có khuyến nghị nào phù hợp</p>
              <p className="text-[12px] text-[#64748b]">
                Thử đổi mức độ ưu tiên hoặc lĩnh vực, hoặc đặt lại bộ lọc để xem toàn bộ danh sách.
              </p>
              <button type="button" onClick={resetFilters} className={BTN_GHOST}>
                <RefreshCw size={15} strokeWidth={2.4} />
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            sorted.map((item) => (
              <SolutionCard
                key={item.id}
                item={item}
                onApply={(it) => handleAction(it, "applied", "đã được đưa vào triển khai")}
                onPlan={(it) => handleAction(it, "planned", "đã được thêm vào kế hoạch")}
                onOpenPlan={openPlan}
              />
            ))
          )}

          {/* Dòng gợi ý mở rộng */}
          {sorted.length > 0 && (
            <div className={`${GLASS} flex flex-wrap items-center justify-between gap-3 p-5`}>
              <p className="text-[12px] text-[#64748b]">
                AI cập nhật khuyến nghị mỗi khi có dữ liệu vận hành mới · Lần phân tích gần nhất: 24/10/2025 06:30
              </p>
              <span className="inline-flex items-center gap-[6px] text-[11px] text-[#94a3b8]">
                <Info size={13} strokeWidth={2.4} />
                Dữ liệu mô phỏng theo Hệ số Lưới điện VN 2024
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-4 py-[8px] text-[12px] font-semibold text-[#059669] backdrop-blur-[12px] transition-all hover:bg-white active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]"
              >
                <Sparkles size={14} strokeWidth={2.4} />
                Yêu cầu AI phân tích lại
                <ArrowRight size={14} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>

        <InsightPanel items={sorted} onReset={resetFilters} />
      </div>

      {/* Modal Action Plan */}
      <ActionPlanModal
        item={planItem}
        onClose={() => setPlanItem(null)}
        onApply={(it) => {
          handleAction(it, "applied", "đã được đưa vào triển khai");
          setPlanItem(null);
        }}
        onPlan={(it) => {
          handleAction(it, "planned", "đã được thêm vào kế hoạch");
          setPlanItem(null);
        }}
      />
    </main>
  );
}