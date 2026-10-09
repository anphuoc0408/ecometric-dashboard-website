/**
 * EcoMetric – Màn hình 5: Báo cáo ESG
 * Phong cách: Apple "iOS Liquid Glass" (glass / glass-press từ index.css)
 *
 * Stack: React + Tailwind CSS v4 + lucide-react
 * Gồm 4 khối chính:
 *   1. Thẻ tổng quan tiến độ chuẩn hoá ESG theo bộ tiêu chuẩn quốc tế (GRI, SASB, TCFD)
 *   2. Bảng tổng hợp chỉ số E-S-G với trạng thái tuân thủ
 *   3. Khu vực xuất báo cáo tự động (PDF / Excel / CSV + chọn kỳ Tháng / Quý / Năm)
 *   4. Panel phụ: mức độ sẵn sàng kiểm toán + kế hoạch hành động
 */
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarRange,
  Check,
  CircleDot,
  CircleSlash,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  Globe,
  Leaf,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
  Zap,
} from "lucide-react";
import { getESGReport } from "./services/api.js";
import useApiData from "./hooks/useApiData.js";
import {
  buildEsgSheets,
  exportToExcel,
  exportToPdf,
  buildEsgPdfTables,
} from "./lib/export.js";

/* ────────────────────────────────
   1. DESIGN TOKENS (kế thừa bảng màu của Dashboard, Phát thải carbon & Khuyến nghị AI)
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
  "inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#10b981] px-4 py-[10px] " +
  `text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] ${FOCUS}`;
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-4 py-[10px] " +
  `text-[13px] font-semibold text-[#0f172a] backdrop-blur-[12px] transition-all hover:bg-white active:scale-[0.98] ${FOCUS}`;

/* ────────────────────────────────
   2. DỮ LIỆU MẪU (thay bằng API sau này)
   ──────────────────────────────── */

/* — Bộ tiêu chuẩn quốc tế & tiến độ chuẩn hoá —
     coverage : tỷ lệ chỉ số đã được chuẩn hoá theo bộ tiêu chuẩn (%)  */
const FRAMEWORKS = [
  {
    id: "gri",
    name: "GRI",
    full: "Global Reporting Initiative",
    desc: "Bộ tiêu chuẩn công bố tác động kinh tế, môi trường và xã hội theo nhóm chủ đề GRI 200 / 300 / 400.",
    coverage: 86,
    total: 142,
    disclosed: 122,
    lastAudit: "Q3/2025",
    color: COLOR.emerald,
    icon: Globe,
  },
  {
    id: "sasb",
    name: "SASB",
    full: "Sustainability Accounting Standards Board",
    desc: "Chuẩn hoá chỉ số trọng yếu theo ngành dệt may – may mặc, phục vụ nhà đầu tư và báo cáo tài chính.",
    coverage: 72,
    total: 54,
    disclosed: 39,
    lastAudit: "Q2/2025",
    color: COLOR.blue,
    icon: Gauge,
  },
  {
    id: "tcfd",
    name: "TCFD",
    full: "Task Force on Climate-related Financial Disclosures",
    desc: "Công bố rủi ro và cơ hội liên quan khí hậu theo 4 trụ cột: Quản trị, Chiến lược, Quản lý rủi ro, Chỉ số & mục tiêu.",
    coverage: 61,
    total: 33,
    disclosed: 20,
    lastAudit: "Chưa kiểm toán",
    color: COLOR.violet,
    icon: ShieldCheck,
  },
];

const FRAMEWORK_REQUIREMENTS = {
  gri: [
    { code: "GRI 305", label: "Phát thải & chất thải", ok: true },
    { code: "GRI 303", label: "Nước & nước thải", ok: true },
    { code: "GRI 306", label: "Chất thải & phụ phẩm", ok: true },
    { code: "GRI 401", label: "Việc làm & an toàn lao động", ok: true },
    { code: "GRI 413", label: "Cộng đồng địa phương", ok: false },
  ],
  sasb: [
    { code: "CG-AA-110", label: "Quản lý nước trong sản xuất", ok: true },
    { code: "CG-AA-120", label: "Quản lý hoá chất & an toàn", ok: true },
    { code: "CG-AA-130", label: "Nguồn gốc nguyên liệu", ok: false },
    { code: "CG-AA-410", label: "An toàn lao động chuỗi cung ứng", ok: true },
    { code: "CG-AA-430", label: "Điều kiện lao động nhà cung cấp", ok: false },
  ],
  tcfd: [
    { code: "Governance", label: "Vai trò ban lãnh đạo với rủi ro khí hậu", ok: true },
    { code: "Strategy", label: "Kịch bản 2°C và tác động tài chính", ok: false },
    { code: "Risk Mgmt", label: "Quy trình nhận diện rủi ro khí hậu", ok: true },
    { code: "Metrics", label: "Chỉ số Scope 1/2/3 & mục tiêu nội bộ", ok: true },
    { code: "Targets", label: "Lộ trình Net Zero 2030 có kiểm chứng", ok: false },
  ],
};

/* — Trạng thái tuân thủ — */
const COMPLIANCE = {
  compliant: {
    label: "Tuân thủ",
    bg: "bg-[#10b981]/14",
    text: "text-[#059669]",
    bar: COLOR.emerald,
    icon: BadgeCheck,
  },
  partial: {
    label: "Tuân thủ một phần",
    bg: "bg-[#fef3c7]",
    text: "text-[#b45309]",
    bar: COLOR.amber,
    icon: TriangleAlert,
  },
  gap: {
    label: "Chưa đạt",
    bg: "bg-[#fee2e2]",
    text: "text-[#991b1b]",
    bar: COLOR.red,
    icon: CircleSlash,
  },
};

/* — Bảng tổng hợp chỉ số E-S-G theo 3 kỳ báo cáo —
     value : giá trị hiện tại của chỉ số
     prev  : giá trị kỳ trước
     target: mục tiêu kỳ này
     higherIsBetter: true = tăng là tốt (ví dụ tỷ lệ lao động nữ)   */
const ESG_MATRIX = {
  month: {
    e: [
      { id: "e1", label: "Cường độ phát thải trên doanh thu", value: 0.42, prev: 0.46, target: 0.4, unit: "tCO2e/tỷ VNĐ", compliance: "partial", owner: "Ban Môi trường", higherIsBetter: false },
      { id: "e2", label: "Tỷ lệ điện tái tạo trong tiêu thụ", value: 21.4, prev: 18.9, target: 25, unit: "%", compliance: "partial", owner: "Ban Năng lượng", higherIsBetter: true },
      { id: "e3", label: "Tỷ lệ nước tuần hoàn tái sử dụng", value: 38.2, prev: 35.4, target: 35, unit: "%", compliance: "compliant", owner: "Nhà máy C", higherIsBetter: true },
      { id: "e4", label: "Chất thải nguy hại xử lý đúng chuẩn", value: 98.6, prev: 97.2, target: 98, unit: "%", compliance: "compliant", owner: "Ban Môi trường", higherIsBetter: true },
      { id: "e5", label: "Sự cố tràn đổ hoá chất", value: 1, prev: 0, target: 0, unit: "vụ", compliance: "gap", owner: "Nhà máy A", higherIsBetter: false },
    ],
    s: [
      { id: "s1", label: "Tỷ lệ tai nạn lao động mất ngày công", value: 1.8, prev: 2.4, target: 2.0, unit: "vụ/1.000 LĐ", compliance: "compliant", owner: "Ban An toàn", higherIsBetter: false },
      { id: "s2", label: "Giờ đào tạo bình quân mỗi lao động", value: 6.4, prev: 5.1, target: 8, unit: "giờ", compliance: "partial", owner: "Ban Nhân sự", higherIsBetter: true },
      { id: "s3", label: "Tỷ lệ lao động nữ trong quản lý", value: 32.5, prev: 30.1, target: 35, unit: "%", compliance: "partial", owner: "Ban Nhân sự", higherIsBetter: true },
      { id: "s4", label: "Tỷ lệ nhà cung cấp được đánh giá ESG", value: 64.0, prev: 52.0, target: 60, unit: "%", compliance: "compliant", owner: "Ban Thu mua", higherIsBetter: true },
      { id: "s5", label: "Sự cố vi phạm quyền lao động", value: 0, prev: 0, target: 0, unit: "vụ", compliance: "compliant", owner: "Ban Nhân sự", higherIsBetter: false },
    ],
    g: [
      { id: "g1", label: "Tỷ lệ thành viên HĐQT độc lập", value: 50.0, prev: 50.0, target: 50, unit: "%", compliance: "compliant", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g2", label: "Tỷ lệ nữ trong HĐQT", value: 25.0, prev: 25.0, target: 33, unit: "%", compliance: "partial", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g3", label: "Công bố thù lao lãnh đạo theo ESG", value: 100, prev: 100, target: 100, unit: "%", compliance: "compliant", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g4", label: "Khiếu nại đạo đức kinh doanh đã xử lý", value: 3, prev: 5, target: 0, unit: "vụ tồn", compliance: "gap", owner: "Ban Kiểm soát", higherIsBetter: false },
      { id: "g5", label: "Hệ thống chống tham nhũng được đánh giá", value: 88.0, prev: 82.0, target: 85, unit: "%", compliance: "compliant", owner: "Ban Kiểm soát", higherIsBetter: true },
    ],
  },
  quarter: {
    e: [
      { id: "e1", label: "Cường độ phát thải trên doanh thu", value: 0.44, prev: 0.49, target: 0.41, unit: "tCO2e/tỷ VNĐ", compliance: "partial", owner: "Ban Môi trường", higherIsBetter: false },
      { id: "e2", label: "Tỷ lệ điện tái tạo trong tiêu thụ", value: 20.2, prev: 16.8, target: 24, unit: "%", compliance: "partial", owner: "Ban Năng lượng", higherIsBetter: true },
      { id: "e3", label: "Tỷ lệ nước tuần hoàn tái sử dụng", value: 36.9, prev: 33.1, target: 35, unit: "%", compliance: "compliant", owner: "Nhà máy C", higherIsBetter: true },
      { id: "e4", label: "Chất thải nguy hại xử lý đúng chuẩn", value: 97.9, prev: 96.5, target: 98, unit: "%", compliance: "partial", owner: "Ban Môi trường", higherIsBetter: true },
      { id: "e5", label: "Sự cố tràn đổ hoá chất", value: 2, prev: 1, target: 0, unit: "vụ", compliance: "gap", owner: "Nhà máy A", higherIsBetter: false },
    ],
    s: [
      { id: "s1", label: "Tỷ lệ tai nạn lao động mất ngày công", value: 2.1, prev: 2.6, target: 2.0, unit: "vụ/1.000 LĐ", compliance: "partial", owner: "Ban An toàn", higherIsBetter: false },
      { id: "s2", label: "Giờ đào tạo bình quân mỗi lao động", value: 5.8, prev: 4.7, target: 8, unit: "giờ", compliance: "partial", owner: "Ban Nhân sự", higherIsBetter: true },
      { id: "s3", label: "Tỷ lệ lao động nữ trong quản lý", value: 31.6, prev: 29.4, target: 35, unit: "%", compliance: "partial", owner: "Ban Nhân sự", higherIsBetter: true },
      { id: "s4", label: "Tỷ lệ nhà cung cấp được đánh giá ESG", value: 58.5, prev: 47.0, target: 60, unit: "%", compliance: "partial", owner: "Ban Thu mua", higherIsBetter: true },
      { id: "s5", label: "Sự cố vi phạm quyền lao động", value: 0, prev: 1, target: 0, unit: "vụ", compliance: "compliant", owner: "Ban Nhân sự", higherIsBetter: false },
    ],
    g: [
      { id: "g1", label: "Tỷ lệ thành viên HĐQT độc lập", value: 50.0, prev: 50.0, target: 50, unit: "%", compliance: "compliant", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g2", label: "Tỷ lệ nữ trong HĐQT", value: 25.0, prev: 25.0, target: 33, unit: "%", compliance: "partial", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g3", label: "Công bố thù lao lãnh đạo theo ESG", value: 100, prev: 75, target: 100, unit: "%", compliance: "compliant", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g4", label: "Khiếu nại đạo đức kinh doanh đã xử lý", value: 6, prev: 8, target: 0, unit: "vụ tồn", compliance: "gap", owner: "Ban Kiểm soát", higherIsBetter: false },
      { id: "g5", label: "Hệ thống chống tham nhũng được đánh giá", value: 85.4, prev: 79.2, target: 85, unit: "%", compliance: "compliant", owner: "Ban Kiểm soát", higherIsBetter: true },
    ],
  },
  year: {
    e: [
      { id: "e1", label: "Cường độ phát thải trên doanh thu", value: 0.47, prev: 0.53, target: 0.42, unit: "tCO2e/tỷ VNĐ", compliance: "partial", owner: "Ban Môi trường", higherIsBetter: false },
      { id: "e2", label: "Tỷ lệ điện tái tạo trong tiêu thụ", value: 18.6, prev: 14.2, target: 25, unit: "%", compliance: "gap", owner: "Ban Năng lượng", higherIsBetter: true },
      { id: "e3", label: "Tỷ lệ nước tuần hoàn tái sử dụng", value: 34.8, prev: 30.5, target: 35, unit: "%", compliance: "partial", owner: "Nhà máy C", higherIsBetter: true },
      { id: "e4", label: "Chất thải nguy hại xử lý đúng chuẩn", value: 97.1, prev: 95.4, target: 98, unit: "%", compliance: "partial", owner: "Ban Môi trường", higherIsBetter: true },
      { id: "e5", label: "Sự cố tràn đổ hoá chất", value: 5, prev: 3, target: 0, unit: "vụ", compliance: "gap", owner: "Nhà máy A", higherIsBetter: false },
    ],
    s: [
      { id: "s1", label: "Tỷ lệ tai nạn lao động mất ngày công", value: 2.4, prev: 2.9, target: 2.0, unit: "vụ/1.000 LĐ", compliance: "partial", owner: "Ban An toàn", higherIsBetter: false },
      { id: "s2", label: "Giờ đào tạo bình quân mỗi lao động", value: 5.2, prev: 4.1, target: 8, unit: "giờ", compliance: "gap", owner: "Ban Nhân sự", higherIsBetter: true },
      { id: "s3", label: "Tỷ lệ lao động nữ trong quản lý", value: 30.4, prev: 28.2, target: 35, unit: "%", compliance: "partial", owner: "Ban Nhân sự", higherIsBetter: true },
      { id: "s4", label: "Tỷ lệ nhà cung cấp được đánh giá ESG", value: 52.0, prev: 41.5, target: 60, unit: "%", compliance: "partial", owner: "Ban Thu mua", higherIsBetter: true },
      { id: "s5", label: "Sự cố vi phạm quyền lao động", value: 1, prev: 2, target: 0, unit: "vụ", compliance: "gap", owner: "Ban Nhân sự", higherIsBetter: false },
    ],
    g: [
      { id: "g1", label: "Tỷ lệ thành viên HĐQT độc lập", value: 50.0, prev: 44.4, target: 50, unit: "%", compliance: "compliant", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g2", label: "Tỷ lệ nữ trong HĐQT", value: 25.0, prev: 22.2, target: 33, unit: "%", compliance: "partial", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g3", label: "Công bố thù lao lãnh đạo theo ESG", value: 75, prev: 50, target: 100, unit: "%", compliance: "partial", owner: "Ban Quản trị", higherIsBetter: true },
      { id: "g4", label: "Khiếu nại đạo đức kinh doanh đã xử lý", value: 11, prev: 14, target: 0, unit: "vụ tồn", compliance: "gap", owner: "Ban Kiểm soát", higherIsBetter: false },
      { id: "g5", label: "Hệ thống chống tham nhũng được đánh giá", value: 79.2, prev: 72.6, target: 85, unit: "%", compliance: "partial", owner: "Ban Kiểm soát", higherIsBetter: true },
    ],
  },
};

/* — Trụ cột E / S / G — */
const PILLARS = [
  { id: "e", letter: "E", name: "Môi trường", sub: "Environmental", color: COLOR.emerald, icon: Leaf },
  { id: "s", letter: "S", name: "Xã hội", sub: "Social", color: COLOR.blue, icon: Users },
  { id: "g", letter: "G", name: "Quản trị", sub: "Governance", color: COLOR.violet, icon: Building2 },
];
const PILLAR_BY_ID = Object.fromEntries(PILLARS.map((p) => [p.id, p]));

/* — Kỳ báo cáo — */
const PERIOD_OPTIONS = [
  { id: "month", label: "Tháng", icon: CalendarRange, title: "Tháng 10/2025" },
  { id: "quarter", label: "Quý", icon: CircleDot, title: "Quý 4/2025" },
  { id: "year", label: "Năm", icon: Building2, title: "Năm 2025" },
];
const PERIOD_TITLE = Object.fromEntries(PERIOD_OPTIONS.map((p) => [p.id, p.title]));

/* — Định dạng xuất báo cáo — */
const EXPORT_FORMATS = [
  {
    id: "pdf",
    label: "PDF",
    desc: "Bản công bố chính thức, có trang bìa và chữ ký số",
    icon: FileText,
    color: COLOR.red,
    ext: ".pdf",
    tone: "Bản công bố",
    size: "4,2 MB",
  },
  {
    id: "excel",
    label: "Excel",
    desc: "Bảng tính nhiều sheet theo từng trụ cột E-S-G, giữ nguyên công thức",
    icon: FileSpreadsheet,
    color: COLOR.emerald,
    ext: ".xlsx",
    tone: "Bảng tính",
    size: "1,8 MB",
  },
  {
    id: "csv",
    label: "CSV",
    desc: "Dữ liệu thô một bảng phẳng, dùng để nạp vào hệ thống khác",
    icon: Download,
    color: COLOR.blue,
    ext: ".csv",
    tone: "Dữ liệu thô",
    size: "320 KB",
  },
];

/* — Mức độ sẵn sàng kiểm toán & kế hoạch hành động — */
const READINESS = [
  { label: "Dữ liệu đã kiểm chứng nội bộ", value: 84, color: COLOR.emerald },
  { label: "Chỉ số có bằng chứng đính kèm", value: 76, color: COLOR.blue },
  { label: "Chỉ số đã kiểm toán độc lập", value: 58, color: COLOR.amber },
  { label: "Rủi ro khí hậu đã định lượng", value: 41, color: COLOR.violet },
];

const ACTION_PLAN = [
  { title: "Bổ sung kịch bản 2°C theo TCFD", owner: "Ban Môi trường", due: "15/11/2025", tone: "gap" },
  { title: "Kiểm toán độc lập chỉ số Scope 1 & 2", owner: "Ban Kiểm soát", due: "30/11/2025", tone: "partial" },
  { title: "Đánh giá ESG cho 40 nhà cung cấp còn lại", owner: "Ban Thu mua", due: "20/12/2025", tone: "partial" },
  { title: "Ban hành quy trình xử lý khiếu nại đạo đức", owner: "Ban Quản trị", due: "31/12/2025", tone: "gap" },
];

/* ────────────────────────────────
   3. HÀM TIỆN ÍCH
   ──────────────────────────────── */
const fmt = (n, digits = 1) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// Định dạng số theo loại chỉ số: nguyên (vụ), 1 chữ số thập phân, hoặc % giữ 1 số
const fmtValue = (value, unit) => {
  if (unit === "vụ" || unit === "vụ tồn") return `${value}`;
  return fmt(value, 1);
};

// Đánh giá xu hướng: so với kỳ trước, có xét chiều "tốt"
const deltaInfo = (item) => {
  const diff = item.value - item.prev;
  const improved = item.higherIsBetter ? diff > 0 : diff < 0;
  const flat = Math.abs(diff) < 0.05;
  return { diff, improved, flat };
};

/* ────────────────────────────────
   4. THÀNH PHẦN GIAO DIỆN
   ──────────────────────────────── */

/* ── Thẻ tiến độ chuẩn hoá theo bộ tiêu chuẩn quốc tế ─────────── */
function FrameworkCard({ framework, active, onSelect }) {
  const Icon = framework.icon;
  const requirementList = FRAMEWORK_REQUIREMENTS[framework.id];
  const metCount = requirementList.filter((r) => r.ok).length;

  return (
    <article
      className={`${GLASS} relative flex cursor-pointer flex-col gap-4 overflow-hidden p-4 sm:p-5 ${
        active ? "ring-2 ring-white/80" : ""
      }`}
      onClick={() => onSelect(framework.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(framework.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={active}
    >
      {/* Vệt màu nhận diện bộ tiêu chuẩn */}
      <span className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: framework.color }} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
            style={{ backgroundColor: `${framework.color}1f` }}
          >
            <Icon size={19} strokeWidth={2.2} color={framework.color} />
          </span>
          <div className="flex min-w-0 flex-col">
            <h3 className="text-[15px] font-bold text-[#0f172a]">{framework.name}</h3>
            <span className="truncate text-[11px] text-[#64748b]">{framework.full}</span>
          </div>
        </div>
        {active && (
          <span className="inline-flex items-center gap-[5px] rounded-full bg-white/70 px-[10px] py-[4px] text-[11px] font-semibold text-[#059669]">
            <Check size={12} strokeWidth={2.8} />
            Đang xem
          </span>
        )}
      </div>

      {/* Tiến độ chuẩn hoá */}
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-end justify-between gap-3">
          <span className="text-[26px] font-extrabold leading-tight text-[#0f172a]">
            {framework.coverage}
            <span className="text-[14px] font-semibold text-[#64748b]">%</span>
          </span>
          <span className="text-[11px] font-semibold text-[#64748b]">
            {framework.disclosed}/{framework.total} chỉ số
          </span>
        </div>
        <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${framework.coverage}%`, backgroundColor: framework.color }}
          />
        </div>
      </div>

      <p className="text-[12px] leading-[1.5] text-[#64748b]">{framework.desc}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/60 pt-3">
        <span className="text-[11px] text-[#94a3b8]">
          {metCount}/{requirementList.length} nhóm yêu cầu đạt
        </span>
        <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-[#64748b]">
          <Clock size={12} strokeWidth={2.4} />
          Kiểm toán: {framework.lastAudit}
        </span>
      </div>
    </article>
  );
}

/* ── Ô chọn kỳ báo cáo (segmented control kiểu iOS) ───────────── */
function PeriodFilter({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Kỳ báo cáo"
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

/* ── Hàng chỉ số trong bảng E-S-G ─────────────────────────────── */
function IndicatorRow({ item, pillar }) {
  const compliance = COMPLIANCE[item.compliance];
  const ComplianceIcon = compliance.icon;
  const { diff, improved, flat } = deltaInfo(item);

  // Tỷ lệ đạt mục tiêu, quy về thang 0–100% (0% = còn kém xa mục tiêu)
  const ratio = useMemo(() => {
    if (item.target === 0) return item.value === 0 ? 100 : Math.max(0, 100 - item.value * 20);
    const ideal = Math.max(item.target, item.value) * 1.15; // mốc "vượt trội" để so
    return item.higherIsBetter
      ? Math.min(100, (item.value / ideal) * 100)
      : Math.min(100, ((ideal - item.value) / ideal) * 100);
  }, [item]);

  return (
    <div className="flex flex-wrap items-center gap-3 border-x border-b border-white/60 px-4 py-[12px] transition-colors hover:bg-white/70 xl:flex-nowrap">
      {/* Chỉ số */}
      <div className="flex min-w-[240px] flex-1 items-center gap-3">
        <span
          className="flex h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: pillar.color }}
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-col gap-[2px]">
          <span className="text-[13px] font-semibold text-[#0f172a]">{item.label}</span>
          <span className="text-[11px] text-[#94a3b8]">Phụ trách: {item.owner}</span>
        </div>
      </div>

      {/* Giá trị hiện tại + đơn vị */}
      <div className="flex w-[150px] shrink-0 items-baseline gap-[5px]">
        <span className="text-[14px] font-bold text-[#0f172a]">{fmtValue(item.value, item.unit)}</span>
        <span className="text-[11px] text-[#64748b]">{item.unit}</span>
      </div>

      {/* Mục tiêu + thanh tiến độ */}
      <div className="flex w-[190px] shrink-0 flex-col gap-[5px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#94a3b8]">Mục tiêu {fmtValue(item.target, item.unit)}</span>
          <span className="font-semibold text-[#64748b]">{ratio.toFixed(0)}%</span>
        </div>
        <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${ratio}%`, backgroundColor: compliance.bar }}
          />
        </div>
      </div>

      {/* So với kỳ trước */}
      <div className="flex w-[120px] shrink-0 items-center gap-[6px]">
        {flat ? (
          <span className="text-[11px] font-semibold text-[#94a3b8]">Không đổi</span>
        ) : (
          <span
            className={`inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11px] font-semibold ${
              improved ? "bg-[#10b981]/12 text-[#059669]" : "bg-[#fee2e2] text-[#991b1b]"
            }`}
          >
            {improved ? <TrendingUp size={12} strokeWidth={2.6} /> : <TrendingDown size={12} strokeWidth={2.6} />}
            {diff > 0 ? "+" : ""}
            {fmt(diff, item.unit === "vụ" || item.unit === "vụ tồn" ? 0 : 1)}
          </span>
        )}
      </div>

      {/* Trạng thái tuân thủ */}
      <div className="w-[160px] shrink-0">
        <span
          className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${compliance.bg} ${compliance.text}`}
        >
          <ComplianceIcon size={12} strokeWidth={2.6} />
          {compliance.label}
        </span>
      </div>
    </div>
  );
}

/* ── Bảng tổng hợp chỉ số E-S-G ───────────────────────────────── */
function EsgTable({ period, matrix: matrixProp }) {
  const [pillarFilter, setPillarFilter] = useState("all");
  // Ưu tiên ma trận từ API; nếu thiếu thì rơi về mock ESG_MATRIX.
  const matrix = matrixProp?.[period] ?? ESG_MATRIX[period];

  const visiblePillars = pillarFilter === "all" ? PILLARS : PILLARS.filter((p) => p.id === pillarFilter);

  // Thống kê trạng thái tuân thủ theo toàn bộ chỉ số của kỳ
  const stats = useMemo(() => {
    const base = { compliant: 0, partial: 0, gap: 0, total: 0 };
    PILLARS.forEach((p) => {
      matrix[p.id].forEach((item) => {
        base[item.compliance] += 1;
        base.total += 1;
      });
    });
    return base;
  }, [matrix]);

  const pillarStats = (pillarId) => {
    const items = matrix[pillarId];
    const compliant = items.filter((i) => i.compliance === "compliant").length;
    return Math.round((compliant / items.length) * 100);
  };

  return (
    <section className={`${GLASS} flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-[#0f172a]">Bảng tổng hợp chỉ số E-S-G</h2>
          <p className="text-[12px] text-[#64748b]">
            Chỉ số Môi trường – Xã hội – Quản trị kèm trạng thái tuân thủ · {PERIOD_TITLE[period]}
          </p>
        </div>

        {/* Bộ lọc trụ cột */}
        <div className="glass-press inline-flex flex-wrap items-center gap-1 rounded-full border border-white/60 bg-white/45 p-1">
          {[{ id: "all", label: "Tất cả", color: COLOR.emeraldDark }, ...PILLARS].map((p) => {
            const active = p.id === pillarFilter;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPillarFilter(p.id)}
                aria-pressed={active}
                className={`rounded-full px-[12px] py-[5px] text-[12px] font-semibold transition-all ${FOCUS} ${
                  active ? "bg-white text-[#0f172a] shadow-[0_2px_6px_-2px_rgba(15,23,42,0.25)]" : "text-[#64748b] hover:text-[#0f172a]"
                }`}
              >
                {p.id === "all" ? p.label : `${p.letter} – ${p.name}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Thanh tổng hợp trạng thái tuân thủ */}
      <div className="flex flex-col gap-3 rounded-[16px] bg-white/55 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] font-semibold text-[#64748b]">
            Tổng {stats.total} chỉ số được công bố
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(COMPLIANCE).map(([id, meta]) => (
              <span key={id} className="inline-flex items-center gap-[6px] text-[11px] font-semibold text-[#64748b]">
                <span className="h-[10px] w-[10px] rounded-[3px]" style={{ backgroundColor: meta.bar }} />
                {meta.label}: {stats[id]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex h-[10px] w-full overflow-hidden rounded-full">
          {Object.entries(COMPLIANCE).map(([id, meta]) => (
            <span
              key={id}
              style={{ width: `${(stats[id] / (stats.total || 1)) * 100}%`, backgroundColor: meta.bar }}
              title={`${meta.label}: ${stats[id]} chỉ số`}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {PILLARS.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-2 text-[11px] text-[#64748b]">
              <span className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: p.color }} />
              {p.letter} · {p.name}: <b className="text-[#0f172a]">{pillarStats(p.id)}%</b> chỉ số tuân thủ đầy đủ
            </span>
          ))}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <div className="min-w-[1080px]">
          {/* Hàng tiêu đề */}
          <div className="flex flex-wrap items-center gap-3 rounded-t-[14px] border border-white/60 bg-white/55 px-4 py-[10px] text-[12px] font-semibold text-[#64748b] backdrop-blur-[12px] xl:flex-nowrap">
            <span className="min-w-[240px] flex-1">Chỉ số E-S-G</span>
            <span className="w-[150px] shrink-0">Giá trị kỳ này</span>
            <span className="w-[190px] shrink-0">Tiến độ so với mục tiêu</span>
            <span className="w-[120px] shrink-0">So kỳ trước</span>
            <span className="w-[160px] shrink-0">Trạng thái tuân thủ</span>
          </div>

          {/* Nhóm theo từng trụ cột */}
          {visiblePillars.map((pillar) => {
            const Icon = pillar.icon;
            const items = matrix[pillar.id];
            return (
              <div key={pillar.id}>
                {/* Dải tiêu đề trụ cột */}
                <div
                  className="flex items-center gap-3 border-x border-b border-white/60 px-4 py-[10px]"
                  style={{ backgroundColor: `${pillar.color}14` }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]"
                    style={{ backgroundColor: `${pillar.color}26` }}
                  >
                    <Icon size={15} strokeWidth={2.2} color={pillar.color} />
                  </span>
                  <span className="text-[13px] font-bold text-[#0f172a]">
                    {pillar.letter} – {pillar.name}
                  </span>
                  <span className="text-[11px] text-[#64748b]">{pillar.sub}</span>
                  <span className="ml-auto text-[11px] font-semibold text-[#64748b]">
                    {items.filter((i) => i.compliance === "compliant").length}/{items.length} tuân thủ
                  </span>
                </div>

                {items.map((item) => (
                  <IndicatorRow key={item.id} item={item} pillar={pillar} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Khu vực xuất báo cáo tự động ─────────────────────────────── */
function ExportPanel({ period, onPeriodChange, selected, onToggle, onExport, message, matrix: matrixProp }) {
  const matrix = matrixProp?.[period] ?? ESG_MATRIX[period];
  const totalIndicators = PILLARS.reduce((s, p) => s + matrix[p.id].length, 0);
  const compliantCount = PILLARS.reduce(
    (s, p) => s + matrix[p.id].filter((i) => i.compliance === "compliant").length,
    0,
  );

  return (
    <section className={`${GLASS} flex flex-col gap-4 p-4 sm:gap-5 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles size={17} strokeWidth={2.2} color={COLOR.emeraldDark} />
            <h2 className="text-[16px] font-bold text-[#0f172a]">Xuất báo cáo tự động</h2>
          </div>
          <p className="text-[12px] text-[#64748b]">
            Kết xuất bộ hồ sơ ESG theo kỳ đã chọn – dữ liệu lấy trực tiếp từ các chỉ số đã công bố
          </p>
        </div>

        {/* Chọn kỳ báo cáo */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={LABEL}>
            <CalendarRange size={13} strokeWidth={2.4} /> Kỳ báo cáo
          </span>
          <PeriodFilter value={period} onChange={onPeriodChange} />
        </div>
      </div>

      {/* Tóm tắt nội dung sẽ xuất */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-[12px] bg-white/55 px-3 py-[8px] text-[12px] text-[#0f172a]">
          <FileText size={14} strokeWidth={2.4} color={COLOR.emeraldDark} />
          Kỳ: <b>{PERIOD_TITLE[period]}</b>
        </span>
        <span className="inline-flex items-center gap-2 rounded-[12px] bg-white/55 px-3 py-[8px] text-[12px] text-[#0f172a]">
          <Gauge size={14} strokeWidth={2.4} color={COLOR.blue} />
          Chỉ số: <b>{totalIndicators}</b>
        </span>
        <span className="inline-flex items-center gap-2 rounded-[12px] bg-[#10b981]/14 px-3 py-[8px] text-[12px] font-semibold text-[#059669]">
          <BadgeCheck size={14} strokeWidth={2.4} />
          Tuân thủ đầy đủ: {compliantCount}/{totalIndicators}
        </span>
      </div>

      {/* Ba lựa chọn định dạng */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {EXPORT_FORMATS.map(({ id, label, desc, icon: Icon, color, ext, tone, size }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              aria-pressed={active}
              className={`glass-press flex flex-col gap-3 rounded-[18px] border p-4 text-left transition-all ${FOCUS} ${
                active
                  ? "border-[#10b981]/60 bg-white/80 shadow-[0_10px_28px_-14px_rgba(16,185,129,0.9)]"
                  : "border-white/70 bg-white/45 hover:bg-white/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: `${color}1f` }}
                >
                  <Icon size={19} strokeWidth={2.2} color={color} />
                </span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                    active ? "border-transparent bg-[#10b981] text-white" : "border-white/70 bg-white/70 text-transparent"
                  }`}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
              </div>

              <div className="flex flex-col gap-[3px]">
                <span className="text-[14px] font-bold text-[#0f172a]">
                  {label} <span className="text-[11px] font-medium text-[#94a3b8]">{ext}</span>
                </span>
                <span className="text-[12px] leading-[1.45] text-[#64748b]">{desc}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/60 pt-3 text-[11px]">
                <span className="rounded-full bg-white/70 px-[9px] py-[3px] font-semibold text-[#64748b]">{tone}</span>
                <span className="text-[#94a3b8]">~{size}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Hành động xuất */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-4">
        <p className="max-w-[560px] text-[11px] leading-[1.5] text-[#94a3b8]">
          Báo cáo được tạo tự động theo dữ liệu mới nhất. Bản PDF kèm chữ ký số của người lập; bản Excel giữ nguyên
          công thức tính chỉ số.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onExport("preview")} className={BTN_GHOST}>
            <Gauge size={15} strokeWidth={2.4} />
            Xem trước
          </button>
          <button
            type="button"
            onClick={() => onExport("export")}
            disabled={selected.length === 0}
            className={`${BTN_PRIMARY} disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#10b981]`}
          >
            <Download size={15} strokeWidth={2.6} />
            Xuất {selected.length > 0 ? `${selected.length} tệp` : "báo cáo"}
            <span className="text-[11px] font-medium text-white/80">· {PERIOD_TITLE[period]}</span>
          </button>
        </div>
      </div>

      {message && (
        <span className="glass inline-flex w-fit items-center gap-2 px-4 py-[10px] text-[12px] font-semibold text-[#059669]">
          <BadgeCheck size={15} strokeWidth={2.6} />
          {message}
        </span>
      )}
    </section>
  );
}

/* ── Panel phụ: mức độ sẵn sàng kiểm toán + kế hoạch hành động ── */
function ReadinessPanel() {
  return (
    <section className={`${GLASS} flex w-full shrink-0 flex-col gap-5 p-4 sm:p-5 xl:w-[400px]`}>
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} strokeWidth={2.2} color={COLOR.emeraldDark} />
        <h2 className="text-[15px] font-bold text-[#0f172a]">Mức độ sẵn sàng kiểm toán</h2>
      </div>

      <ul className="flex flex-col gap-3">
        {READINESS.map(({ label, value, color }) => (
          <li key={label} className="flex flex-col gap-[6px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-medium text-[#0f172a]">{label}</span>
              <span className="text-[12px] font-bold text-[#64748b]">{value}%</span>
            </div>
            <div className="h-[7px] w-full overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${value}%`, backgroundColor: color }}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Kế hoạch hành động */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[13px] font-bold text-[#0f172a]">Kế hoạch hành động còn lại</h3>
        <ul className="flex flex-col gap-2">
          {ACTION_PLAN.map(({ title, owner, due, tone }) => {
            const meta = COMPLIANCE[tone];
            const Icon = meta.icon;
            return (
              <li key={title} className="flex items-start gap-3 rounded-[14px] bg-white/55 px-4 py-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: `${meta.bar}1f` }}
                >
                  <Icon size={15} strokeWidth={2.2} color={meta.bar} />
                </span>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <span className="text-[12px] font-semibold leading-[1.4] text-[#0f172a]">{title}</span>
                  <span className="text-[11px] text-[#64748b]">
                    {owner} · hạn {due}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Nhắc nhở tuân thủ */}
      <div className="flex items-start gap-3 rounded-[16px] bg-[#fef3c7] px-4 py-4">
        <TriangleAlert size={17} strokeWidth={2.4} color="#b45309" className="mt-[2px] shrink-0" />
        <div className="flex flex-col gap-[2px]">
          <span className="text-[12px] font-bold text-[#b45309]">Còn 4 hạng mục chưa đạt</span>
          <span className="text-[11px] leading-[1.45] text-[#64748b]">
            Cần hoàn tất trước kỳ công bố để bộ hồ sơ đủ điều kiện kiểm toán độc lập.
          </span>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────
   5. TRANG BÁO CÁO ESG
   ──────────────────────────────── */
export default function ESGReporting() {
  const [period, setPeriod] = useState("quarter");
  const [activeFramework, setActiveFramework] = useState("gri");
  const [selectedFormats, setSelectedFormats] = useState(["pdf", "excel"]);
  const [message, setMessage] = useState(null);
  // Cờ đang kết xuất – tránh người dùng bấm nút nhiều lần gây tải trùng tệp.
  const [busy, setBusy] = useState(false);

  // Gọi FastAPI để lấy dữ liệu báo cáo phát thải (ma trận chỉ số E-S-G theo kỳ).
  // Nếu backend chưa chạy → dùng ESG_MATRIX mock. Refetch khi đổi kỳ báo cáo.
  const { data: esgData, loading, usingFallback } = useApiData(
    (signal) => getESGReport({ period, format: "json", signal }),
    { fallbackData: null, deps: [period] },
  );

  // Payload có thể là { matrix: {...} } hoặc chính ma trận { month, quarter, year }.
  const matrix = useMemo(() => {
    const raw = esgData?.matrix ?? esgData;
    return raw && (raw.month || raw.quarter || raw.year) ? raw : ESG_MATRIX;
  }, [esgData]);

  const toggleFormat = (id) => {
    setMessage(null);
    setSelectedFormats((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleExport = (mode) => {
    if (selectedFormats.length === 0) return;
    const names = selectedFormats
      .map((id) => EXPORT_FORMATS.find((f) => f.id === id))
      .map((f) => `${f.label}${f.ext}`)
      .join(", ");
    setMessage(
      mode === "preview"
        ? `Đang tạo bản xem trước cho ${PERIOD_TITLE[period]}…`
        : `Đã kết xuất ${names} · ${PERIOD_TITLE[period]}`,
    );
    // TODO: gọi API kết xuất báo cáo tại đây (src/services/api.js).
  };

  /* ── Xuất EXCEL: toàn bộ bảng chỉ số E-S-G thành các sheet ───────── */
  const handleExportExcel = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const fileName = await exportToExcel({
        fileName: `ecometric-esg-${period}`,
        sheets: buildEsgSheets({ matrix: matrix[period], periodLabel: PERIOD_TITLE[period], pillars: PILLARS }),
      });
      setMessage(`Đã xuất dữ liệu Excel: ${fileName}`);
    } catch (err) {
      setMessage(`Lỗi xuất Excel: ${err?.message ?? "không xác định"}`);
    } finally {
      setBusy(false);
    }
  };

  /* ── Xuất PDF: báo cáo đầy đủ theo kỳ đang chọn ─────────────────── */
  const handleExportPdf = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const all = PILLARS.flatMap((p) => matrix[period][p.id]);
      const compliant = all.filter((i) => i.compliance === "compliant").length;
      const fileName = await exportToPdf({
        fileName: `ecometric-esg-${period}`,
        title: "BÁO CÁO BỀN VỮNG ESG",
        subtitle: "EcoMetric – Nền tảng quản lý dữ liệu vận hành & theo dõi giảm phát thải CO2e",
        meta: [
          `Kỳ báo cáo: ${PERIOD_TITLE[period]}`,
          `Tổng số chỉ số công bố: ${all.length}`,
          `Tuân thủ đầy đủ: ${compliant}/${all.length} (${all.length ? Math.round((compliant / all.length) * 100) : 0}%)`,
          `Ngày kết xuất: ${new Date().toLocaleString("vi-VN")}`,
        ],
        tables: buildEsgPdfTables({ matrix: matrix[period], pillars: PILLARS }),
      });
      setMessage(`Đã tải báo cáo PDF: ${fileName}`);
    } catch (err) {
      setMessage(`Lỗi xuất PDF: ${err?.message ?? "không xác định"}`);
    } finally {
      setBusy(false);
    }
  };

  const averageCoverage = Math.round(
    FRAMEWORKS.reduce((s, f) => s + f.coverage, 0) / FRAMEWORKS.length,
  );
  const activeFw = FRAMEWORKS.find((f) => f.id === activeFramework);
  const ActiveFwIcon = activeFw.icon;
  const requirementList = FRAMEWORK_REQUIREMENTS[activeFramework];
  const openRequirements = requirementList.filter((r) => !r.ok);

  return (
    <main className="flex min-h-[calc(100vh-73px)] min-w-0 flex-1 flex-col gap-5 p-4 pb-24 sm:gap-6 sm:p-6 lg:pb-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-[6px]">
          <h1 className="text-[20px] font-extrabold leading-tight text-[#0f172a] sm:text-[24px]">Báo cáo ESG</h1>
          <p className="text-[13px] leading-snug text-[#64748b] sm:text-[14px]">
            Tiến độ chuẩn hoá theo GRI, SASB, TCFD · Chỉ số E-S-G và xuất hồ sơ công bố ·{" "}
            <b className="text-[#0f172a]">{PERIOD_TITLE[period]}</b>
          </p>
          {(loading || usingFallback) && (
            <p className="text-[11px] font-semibold text-[#94a3b8]">
              {loading ? "Đang tải báo cáo ESG…" : "Đang dùng dữ liệu mô phỏng (backend chưa kết nối)"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={LABEL}>
            <Zap size={13} strokeWidth={2.4} /> Mức độ chuẩn hoá trung bình
            <b className="ml-1 text-[13px] text-[#059669]">{averageCoverage}%</b>
          </span>

          {/* Xuất dữ liệu Excel (toàn bộ bảng chỉ số E-S-G) */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={busy}
            className={BTN_GHOST}
          >
            <FileSpreadsheet size={15} strokeWidth={2.4} />
            Xuất dữ liệu Excel
          </button>

          {/* Tải báo cáo PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={busy}
            className={BTN_PRIMARY}
          >
            <Download size={15} strokeWidth={2.6} />
            {busy ? "Đang kết xuất…" : "Tải báo cáo PDF"}
          </button>
        </div>
      </div>

      {/* Thẻ tiến độ theo bộ tiêu chuẩn quốc tế */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FRAMEWORKS.map((f) => (
          <FrameworkCard
            key={f.id}
            framework={f}
            active={f.id === activeFramework}
            onSelect={setActiveFramework}
          />
        ))}
      </div>

      {/* Chi tiết bộ tiêu chuẩn đang chọn + bảng E-S-G */}
      <div className="flex flex-col items-stretch gap-5 xl:flex-row">
        <EsgTable period={period} matrix={matrix} />
        <ReadinessPanel />
      </div>

      {/* Yêu cầu còn thiếu của bộ tiêu chuẩn đang chọn */}
      <div className={`${GLASS} flex flex-col gap-4 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-bold text-[#0f172a]">
              Yêu cầu công bố theo {activeFw.name}
            </h2>
            <p className="text-[12px] text-[#64748b]">
              {activeFw.full} · còn {openRequirements.length}/{requirementList.length} nhóm yêu cầu chưa đạt
            </p>
          </div>
          <span
            className="inline-flex items-center gap-[6px] rounded-full px-[12px] py-[6px] text-[12px] font-semibold"
            style={{ backgroundColor: `${activeFw.color}1f`, color: activeFw.color }}
          >
            <ActiveFwIcon size={14} strokeWidth={2.4} />
            {activeFw.coverage}% đã chuẩn hoá
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {requirementList.map(({ code, label, ok }) => (
            <li
              key={code}
              className="flex items-start gap-3 rounded-[14px] border border-white/60 bg-white/55 px-4 py-3"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] ${
                  ok ? "bg-[#10b981]/14 text-[#059669]" : "bg-[#fee2e2] text-[#991b1b]"
                }`}
              >
                {ok ? <Check size={14} strokeWidth={2.8} /> : <CircleSlash size={14} strokeWidth={2.6} />}
              </span>
              <div className="flex min-w-0 flex-col gap-[2px]">
                <span className="text-[11px] font-bold text-[#94a3b8]">{code}</span>
                <span className="text-[12px] font-semibold leading-[1.4] text-[#0f172a]">{label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Khu vực xuất báo cáo tự động */}
      <ExportPanel
        period={period}
        onPeriodChange={setPeriod}
        selected={selectedFormats}
        onToggle={toggleFormat}
        onExport={handleExport}
        message={message}
        matrix={matrix}
      />
    </main>
  );
}