/**
 * EcoMetric – Dashboard (Tổng quan)
 * Nguồn thiết kế: Figma "EcoMetric - Web App MVP" › frame `ecometric-dashboard` (node 3:4, 1440 × 1530)
 *
 * Stack: React + Tailwind CSS + lucide-react
 *   npm i lucide-react
 * Font: Inter (400 / 500 / 600 / 700 / 800) – thêm vào index.html:
 *   <link rel="preconnect" href="https://fonts.googleapis.com" />
 *   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
 *   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
 */
import { useRef, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  CircleSlash,
  ClipboardList,
  CloudUpload,
  Cpu,
  Check,
  Database,
  Download,
  Droplet,
  FileText,
  Flame,
  Info,
  Leaf,
  Lightbulb,
  PanelsTopLeft,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import DataInput from "./DataInput.jsx";
import CarbonEmissions from "./CarbonEmissions.jsx";
import AIRecommendations from "./AIRecommendations.jsx";
import ESGReporting from "./ESGReporting.jsx";
import Settings from "./Settings.jsx";
import QRCodeButton from "./QRCodeCard.jsx";

/* ────────────────────────────────────────────────────────────────
   0. HÀM ĐỊNH DẠNG DÙNG CHUNG
   Khai báo bằng `function` (hoisted) để dùng an toàn ở mọi hằng số
   mảng/dữ liệu phía dưới – tránh lỗi Temporal Dead Zone.
   ──────────────────────────────────────────────────────────────── */
function fmt(n, digits = 1) {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtInt(n) {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

// Rút gọn chi phí: 15,00 triệu VNĐ / 2,85 tỷ VNĐ
function fmtMoney(n) {
  if (n === undefined || n === null) return "0 VNĐ";
  if (n >= 1_000_000_000) return `${fmt(n / 1_000_000_000, 2)} tỷ VNĐ`;
  if (n >= 1_000_000) return `${fmt(n / 1_000_000, 2)} triệu VNĐ`;
  return `${fmtInt(n)} VNĐ`;
}

/* ────────────────────────────────────────────────────────────────
   1. DESIGN TOKENS
   ──────────────────────────────────────────────────────────────── */
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

// Lớp bề mặt kính của Dashboard.
// `card` dùng cho thẻ/khối, `modal` dùng cho hộp thoại Action Plan.
const GLASS = {
  card: "bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-xl",
  modal: "bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl",
};

// Class dùng lại nhiều lần
const CARD =
  "bg-white border border-[#e2e8f0] rounded-[16px] shadow-[0_2px_2px_rgba(0,0,0,0.02)]";
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]";

/* ────────────────────────────────────────────────────────────────
   2. DỮ LIỆU (thay bằng API sau này)
   ──────────────────────────────────────────────────────────────── */
// Ảnh avatar xuất từ Figma – link Figma chỉ sống 7 ngày.
// Tải ảnh về, đặt vào /public/avatar.png rồi đổi thành "/avatar.png".
const AVATAR_URL =
  "https://www.figma.com/api/mcp/asset/4fb0518d-0993-430d-9de3-66a58a0a179a.png";

const PAGE_TITLE = "CANVAS MẪU THIẾT KẾ WEB ECOMETRIC";
const PAGE_SUBTITLE =
  "Bố cục tham khảo cho dashboard quản lý dữ liệu vận hành, phát thải và khuyến nghị tối ưu";

const NAV_ITEMS = [
  { id: "overview", label: "Tổng quan", icon: PanelsTopLeft },
  { id: "operations", label: "Dữ liệu vận hành", icon: Database },
  { id: "carbon", label: "Phát thải carbon", icon: Activity },
  { id: "ai", label: "Khuyến nghị AI", icon: Cpu },
  { id: "esg", label: "Báo cáo ESG", icon: FileText },
  { id: "settings", label: "Cài đặt", icon: SettingsIcon },
];

/* ── Nguồn số liệu dùng chung ─────────────────────────────────────
     Đồng bộ với AIRecommendations.jsx: cùng hệ số lưới điện VN 2024
     và cùng kịch bản hoán cải LED tại Xưởng 1.                     */
const GRID_FACTOR = 0.6766;

const PROVENANCE_TEXT = "Dữ liệu mô phỏng theo Hệ số Lưới điện VN 2024 (0.6766 kg CO₂e/kWh)";

function DataProvenanceTag({ compact = false }) {
  return (
    <span
      className={`inline-flex items-center gap-[6px] rounded-full bg-[#dbeafe] px-[10px] py-[4px] text-[11px] font-semibold text-[#1d4ed8] ${
        compact ? "whitespace-nowrap" : ""
      }`}
    >
      <Info size={12} strokeWidth={2.6} />
      {compact ? `Hệ số lưới điện VN 2024 · ${GRID_FACTOR} kg CO₂e/kWh` : PROVENANCE_TEXT}
    </span>
  );
}

/* ── Kịch bản LED Xưởng 1 – bộ số chuẩn (nguồn: AIRecommendations.jsx) ── */
const LED_RETROFIT_CASE = {
  title: "Thay 100 bóng đèn huỳnh quang 40W bằng LED 18W tại Xưởng 1",
  kwhMonth: 1_056,
  kwhYear: 12_672,
  capex: 15_000_000,
  savingMonth: 2_640_000,
  savingYear: 31_680_000,
  reductionMonth: 0.714,
  reductionYear: 8.573,
  payback: 5.7,
  roiYear1: 111.2,
};

/* ── Top 3 việc cần làm ngay trong tháng ─────────────────────────
     kind: "led" dùng lại bộ số LED_RETROFIT_CASE ở trên.         */
const ACTIONABLE_PRIORITIES = [
  {
    no: 1,
    kind: "led",
    icon: Lightbulb,
    color: COLOR.emerald,
    title: LED_RETROFIT_CASE.title,
    site: "Xưởng 1",
    level: "Cấp Xưởng · Hoàn thành trong 7 ngày",
    saving: "2,64 triệu VNĐ/tháng (31,68 triệu/năm)",
    reduction: `${LED_RETROFIT_CASE.reductionMonth} tCO₂e/tháng (${LED_RETROFIT_CASE.reductionYear} tCO₂e/năm)`,
    payback: `${LED_RETROFIT_CASE.payback} tháng`,
    note: `Tiết kiệm ${LED_RETROFIT_CASE.kwhMonth} kWh/tháng · CAPEX ${fmtMoney(LED_RETROFIT_CASE.capex)} · Simple ROI năm 1 ${LED_RETROFIT_CASE.roiYear1}%`,
  },
  {
    no: 2,
    kind: "data",
    icon: Flame,
    color: COLOR.amber,
    title: "Bảo dưỡng & hiệu chỉnh tỷ lệ gió/nhiên liệu Nồi hơi Xưởng 2",
    site: "Xưởng 2",
    level: "Cấp Xưởng · Hoàn thành trong 10 ngày",
    saving: "4,5 triệu VNĐ/tháng",
    reduction: "1,025 tCO₂e/tháng (12,3 tCO₂e/năm)",
    payback: "4,2 tháng",
    note: "Hiệu chỉnh tỷ lệ gió/nhiên liệu, vệ sinh vòi đốt để giảm tiêu hao dầu DO",
  },
  {
    no: 3,
    kind: "leak",
    icon: Droplet,
    color: COLOR.blue,
    title: "Khắc phục rò rỉ đường ống cấp nước sinh hoạt Khu B",
    site: "Khu B",
    level: "Cấp Phân xưởng · Hoàn thành trong 5 ngày",
    saving: "1,2 triệu VNĐ/tháng",
    reduction: "Giảm lãng phí 150 m³ nước/tháng",
    payback: "Không cần đầu tư lớn",
    note: "Kiểm tra đầu van, khóa và các mối nối tại tuyến cấp nước Khu B",
  },
];

const METRICS = [
  { label: "Tổng phát thải CO2e", value: "1,245.8 tấn CO2e", delta: "-12.4%", note: "so với tháng trước", accent: COLOR.emerald, tone: "good" },
  { label: "Chi phí vận hành", value: "482,900,000 VNĐ", delta: "-4.2%", note: "so với tháng trước", accent: COLOR.blue, tone: "good" },
  { label: "Dữ liệu tháng này", value: "2,480 bản ghi", delta: "+18.5%", note: "so với tháng trước", accent: COLOR.amber, tone: "good" },
  // Đồng bộ với bộ số chuẩn LED_RETROFIT_CASE:
  // phát thải 8,573 tCO2e/năm + chi phí tiết kiệm 31,68 triệu VNĐ/năm
  {
    label: "Mức tiết kiệm tiềm năng (Top 3)",
    value: "35,3 triệu VNĐ và 25,5 tấn CO2e/năm",
    delta: "+15.0%",
    note: "từ 3 việc cần làm ngay, so với hiện tại",
    accent: COLOR.red,
    tone: "bad",
  },
];

const DELTA_STYLE = {
  good: "bg-[#10b981]/10 text-[#059669]",
  bad: "bg-[#fee2e2] text-[#991b1b]",
};

/* ── Hàm định dạng dùng chung ────────────────────────────────────
     Đã chuyển lên đầu file (mục 0) dưới dạng hoisted function.      */

// Toạ độ đường xu hướng & cột nền – lấy nguyên từ vector trong Figma (vùng vẽ 640 × 180)
const TREND_POINTS = [
  [0.4, 85.3], [58.4, 102.4], [116.1, 63.6], [174.9, 125.8],
  [232.0, 29.6], [291.1, 1.4], [349.7, 46.4], [407.7, 69.4],
  [465.8, 108.4], [524.7, 142.4], [582.5, 170.3], [640.3, 181.2],
];
const TREND_BARS = [
  [0, 95.7, 59, 87], [58, 84.7, 59, 98], [116, 95.7, 60, 87], [175, 78.7, 59, 104],
  [233, 16.7, 59, 166], [291, 25.7, 59, 157], [349, 59.7, 59, 123], [407, 90.7, 59, 92],
  [465, 126.7, 60, 56], [524, 157.7, 59, 25], [582, 177.7, 59, 5],
];
const Y_LABELS = [60, 45, 30, 15, 0];
const X_LABELS = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

const RESOURCES = [
  { label: "Điện năng", value: 40, color: COLOR.emerald },
  { label: "Nước", value: 25, color: COLOR.blue },
  { label: "Nhiên liệu", value: 20, color: COLOR.amber },
  { label: "Nguyên liệu", value: 10, color: COLOR.violet },
  { label: "Khác", value: 5, color: COLOR.slate },
];

const ALERTS = [
  { title: "Quá tải điện năng", desc: "Khu vực sản xuất vượt ngưỡng 15% hạn mức", time: "Hôm nay", tone: "red" },
  { title: "Thất thoát nước đột ngột", desc: "Ghi nhận lưu lượng tăng lạ tại xưởng B", time: "Hôm qua", tone: "red" },
  { title: "Phụ phẩm chưa xử lý", desc: "Hệ thống lưu trữ sắp đạt công suất tối đa", time: "2 ngày trước", tone: "amber" },
];
const ALERT_TONE = {
  red: { bg: "bg-[#fee2e2]", icon: COLOR.red },
  amber: { bg: "bg-[#fef3c7]", icon: COLOR.amber },
};

const SUGGESTIONS = [
  { icon: Zap, title: "Gợi ý 1: Tối ưu điện", desc: "Điều chỉnh khung giờ cao điểm hoạt động thiết bị." },
  { icon: Droplet, title: "Gợi ý 2: Giảm thất thoát", desc: "Kiểm soát các đầu van khóa tại khu B định kỳ." },
  { icon: RefreshCw, title: "Gợi ý 3: Phụ phẩm", desc: "Tái chế xơ dừa làm vật liệu sinh học lót sàn." },
  { icon: TrendingUp, title: "Gợi ý 4: Tối ưu quy trình", desc: "Số hóa toàn bộ hồ sơ khai báo để loại bỏ giấy." },
];

const STATUS = {
  done: { label: "Hoàn thành", cls: "bg-[#10b981]/10 text-[#059669]" },
  processing: { label: "Đang xử lý", cls: "bg-[#fef3c7] text-[#d97706]" },
  error: { label: "Lỗi", cls: "bg-[#fee2e2] text-[#991b1b]" },
};

const REPORTS = [
  { time: "10:24 - 12/10", type: "Báo cáo CO2 Tháng 9", desc: "Khai báo dữ liệu khí thải trực tiếp và gián tiếp của toàn bộ nhà xưởng.", status: "done", action: "Xem chi tiết" },
  { time: "09:15 - 11/10", type: "Hao phí Tài nguyên nước", desc: "Thống kê lượng nước sử dụng cho dệt nhuộm và sinh hoạt công nhân.", status: "processing", action: "Chỉnh sửa" },
  { time: "16:30 - 08/10", type: "Báo cáo Rác thải Rắn", desc: "Phân loại phụ phẩm công nghiệp và rác thải nguy hại định kỳ.", status: "done", action: "Xem chi tiết" },
  { time: "14:00 - 05/10", type: "Khai trình ESG Q3", desc: "Tổng hợp các chỉ số phát triển bền vững trình ban giám đốc.", status: "done", action: "Xem chi tiết" },
  { time: "11:45 - 02/10", type: "Kiểm kê Khí nhà kính", desc: "Dữ liệu phát thải phát sinh từ đội xe vận tải logistics.", status: "error", action: "Gửi lại" },
];

/* ────────────────────────────────────────────────────────────────
   3. THÀNH PHẦN GIAO DIỆN
   ──────────────────────────────────────────────────────────────── */

/* ── Topbar ─────────────────────────────────────────────────── */
function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e2e8f0] bg-white px-6 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#10b981]/10">
          <Leaf size={18} strokeWidth={2} color={COLOR.emeraldDark} />
        </div>
        <span className="text-[20px] font-extrabold text-[#0f172a]">EcoMetric</span>
      </div>

      {/* Tìm kiếm */}
      <label className="hidden w-[400px] items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 md:flex">
        <Search size={16} strokeWidth={2} color={COLOR.muted} className="shrink-0" />
        <input
          type="search"
          placeholder="Tìm kiếm dữ liệu, báo cáo..."
          className="h-4 min-w-0 flex-1 bg-transparent text-[13px] text-[#0f172a] outline-none placeholder:text-[#64748b]"
        />
      </label>

      {/* Thông báo + QR + tài khoản */}
      <div className="flex items-center gap-4">
        <QRCodeButton />

        <button
          type="button"
          aria-label="Thông báo"
          className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] ${FOCUS}`}
        >
          <Bell size={20} strokeWidth={2} color={COLOR.slate} />
          <span className="absolute left-[23px] top-[7px] h-2 w-2 rounded-full bg-[#ef4444]" />
        </button>

        <div className="flex items-center gap-2">
          <img
            src={AVATAR_URL}
            alt="Ảnh đại diện"
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="flex flex-col gap-[2px] whitespace-nowrap">
            <span className="text-[13px] font-semibold text-[#0f172a]">Nguyễn Văn A</span>
            <span className="text-[11px] text-[#64748b]">Quản trị viên</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ active, onChange }) {
  return (
    <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-[260px] shrink-0 flex-col justify-between self-start border-r border-[#e2e8f0] bg-white p-5 lg:flex">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-[10px] px-4 py-3 text-left text-[14px] transition-colors ${FOCUS} ${
                isActive
                  ? "bg-[#10b981]/10 font-semibold text-[#059669]"
                  : "bg-transparent font-medium text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <span className="h-4 w-1 rounded-[2px] bg-[#10b981]" />}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2 rounded-[12px] bg-[#10b981]/10 p-4 text-center">
        <Leaf size={32} strokeWidth={2} color={COLOR.emerald} />
        <p className="text-[13px] font-semibold text-[#059669]">Hành Động Vì Trái Đất</p>
        <p className="text-[11px] text-[#64748b]">
          Từng bước nhỏ tối ưu phát thải định hình tương lai vững bền.
        </p>
      </div>
    </aside>
  );
}

/* ── Khối nổi bật: Top 3 việc cần làm ngay trong tháng ──────── */
function ActionablePrioritiesCard({ onOpenPlan, onGoToAI }) {
  return (
    <section className={`${GLASS.card} relative flex flex-col gap-4 overflow-hidden p-5`}>
      {/* Vệt nhấn nhận diện khối hành động */}
      <span className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: COLOR.emerald }} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#10b981]/14">
            <Zap size={19} strokeWidth={2.2} color={COLOR.emeraldDark} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-bold text-[#0f172a]">
              Top 3 việc cần làm ngay trong tháng
            </h2>
            <p className="text-[12px] text-[#64748b]">
              Actionable Priorities · xếp hạng theo tác động phát thải, chi phí và thời gian hoàn vốn
            </p>
          </div>
        </div>
        <DataProvenanceTag />
      </div>

      {/* Ba thẻ ưu tiên */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {ACTIONABLE_PRIORITIES.map((item) => {
          const Icon = item.icon;
          const isLed = item.kind === "led";

          return (
            <article
              key={item.no}
              className="glass-press relative flex flex-col gap-3 overflow-hidden rounded-[18px] border border-white/70 bg-white/55 p-4"
            >
              <span className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: item.color }} />

              {/* Số hiệu ưu tiên + địa điểm */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                    style={{ backgroundColor: `${item.color}1f` }}
                  >
                    <Icon size={17} strokeWidth={2.2} color={item.color} />
                  </span>
                  <div className="flex min-w-0 flex-col gap-[2px]">
                    <span
                      className="inline-flex w-fit items-center rounded-full px-[9px] py-[3px] text-[10px] font-bold uppercase"
                      style={{ backgroundColor: `${item.color}1f`, color: item.color }}
                    >
                      Ưu tiên {String(item.no).padStart(2, "0")}
                    </span>
                    <span className="text-[11px] text-[#94a3b8]">{item.level}</span>
                  </div>
                </div>
              </div>

              {/* Tên giải pháp */}
              <h3 className="text-[13px] font-bold leading-[1.45] text-[#0f172a]">{item.title}</h3>

              {/* Ba thông số chính */}
              <ul className="flex flex-col gap-2 rounded-[14px] bg-white/60 px-3 py-3">
                <li className="flex items-start gap-2">
                  <Wallet size={13} strokeWidth={2.6} color={COLOR.blue} className="mt-[2px] shrink-0" />
                  <span className="flex min-w-0 flex-col gap-[1px]">
                    <span className="text-[10px] text-[#94a3b8]">Tiết kiệm chi phí</span>
                    <span className="text-[12px] font-bold text-[#0f172a]">{item.saving}</span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Leaf size={13} strokeWidth={2.6} color={COLOR.emeraldDark} className="mt-[2px] shrink-0" />
                  <span className="flex min-w-0 flex-col gap-[1px]">
                    <span className="text-[10px] text-[#94a3b8]">Giảm phát thải / lãng phí</span>
                    <span className="text-[12px] font-bold text-[#0f172a]">{item.reduction}</span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <RefreshCw size={13} strokeWidth={2.6} color={COLOR.violet} className="mt-[2px] shrink-0" />
                  <span className="flex min-w-0 flex-col gap-[1px]">
                    <span className="text-[10px] text-[#94a3b8]">Hoàn vốn</span>
                    <span className="text-[12px] font-bold text-[#0f172a]">{item.payback}</span>
                  </span>
                </li>
              </ul>

              {/* Ghi chú cơ sở tính */}
              <p className="text-[10px] leading-[1.5] text-[#94a3b8]">{item.note}</p>

              {/* Hành động */}
              <div className="mt-auto border-t border-white/60 pt-3">
                {isLed ? (
                  <button
                    type="button"
                    onClick={() => onOpenPlan(item)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#10b981] px-4 py-[10px] text-[12px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] ${FOCUS}`}
                  >
                    <ClipboardList size={14} strokeWidth={2.6} />
                    Tạo Action Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onGoToAI}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-4 py-[10px] text-[12px] font-semibold text-[#0f172a] backdrop-blur-[12px] transition-all hover:bg-white active:scale-[0.98] ${FOCUS}`}
                  >
                    <Cpu size={14} strokeWidth={2.4} />
                    Xem trong Khuyến nghị AI
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ── Hộp thoại Action Plan 5 bước (đồng bộ với AIRecommendations.jsx) ── */
function ActionPlanModal({ item, onClose }) {
  if (!item) return null;

  const isLed = item.kind === "led";
  const steps = isLed
    ? [
        { no: 1, task: "Khảo sát hiện trạng & đo đạc độ rọi Xưởng 1", owner: "Kỹ thuật Xưởng 1", due: "05/11/2025", done: true },
        { no: 2, task: "Lập danh mục vật tư, báo giá 100 bộ LED tuýp 18W", owner: "Ban Thu mua", due: "07/11/2025", done: true },
        { no: 3, task: "Phê duyệt CAPEX 15.000.000 VNĐ", owner: "Ban Giám đốc", due: "10/11/2025", done: false },
        { no: 4, task: "Thi công thay thế 100 bóng, theo từng khu vực", owner: "Đội Cơ điện", due: "18/11/2025", done: false },
        { no: 5, task: "Nghiệm thu, đo lại độ rọi & chốt số kWh tiết kiệm", owner: "Ban Năng lượng", due: "21/11/2025", done: false },
      ]
    : [
        { no: 1, task: "Xác nhận hiện trạng và phạm vi can thiệp", owner: "Kỹ thuật nhà xưởng", due: "Đang cập nhật", done: false },
        { no: 2, task: "Lập phương án kỹ thuật & dự toán", owner: "Ban Kỹ thuật", due: "Đang cập nhật", done: false },
        { no: 3, task: "Phê duyệt phương án và bố trí nguồn lực", owner: "Ban Giám đốc", due: "Đang cập nhật", done: false },
        { no: 4, task: "Thi công theo phương án đã duyệt", owner: "Đội Cơ điện", due: "Đang cập nhật", done: false },
        { no: 5, task: "Nghiệm thu & đo lường kết quả tiết kiệm", owner: "Ban Năng lượng", due: "Đang cập nhật", done: false },
      ];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  // Bảng so sánh KPI chỉ áp dụng cho kịch bản LED đã có số liệu đo
  const kpiRows = isLed
    ? [
        { label: "Điện năng tiêu thụ Xưởng 1", unit: "kWh/tháng", before: 20_000, after: 18_944 },
        { label: "Phát thải từ chiếu sáng Xưởng 1", unit: "tCO2e/tháng", before: 13.53, after: 12.818 },
        { label: "Công suất chiếu sáng", unit: "kW", before: 4.0, after: 1.8 },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0f172a]/35 p-4 backdrop-blur-[6px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dash-action-plan-title"
      onClick={onClose}
    >
      <div
        className={`${GLASS.modal} my-auto flex w-full max-w-[860px] flex-col gap-5 p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Đầu hộp thoại */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-[6px] rounded-full bg-[#10b981]/14 px-[10px] py-[4px] text-[11px] font-bold text-[#059669]">
                <ClipboardList size={12} strokeWidth={2.6} />
                Action Plan · Ưu tiên {String(item.no).padStart(2, "0")}
              </span>
              <DataProvenanceTag compact />
            </div>
            <h2 id="dash-action-plan-title" className="text-[18px] font-extrabold leading-snug text-[#0f172a]">
              {item.title}
            </h2>
            <p className="text-[12px] text-[#64748b]">
              {item.level} · Tiết kiệm <b className="text-[#0f172a]">{item.saving}</b> · Hoàn vốn{" "}
              <b className="text-[#0f172a]">{item.payback}</b>
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

        {/* Tiến độ */}
        <div className="flex flex-col gap-[6px]">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[#64748b]">
              Tiến độ: {doneCount}/{steps.length} bước hoàn thành
            </span>
            <span className="text-[#059669]">{progress}%</span>
          </div>
          <div className="h-[8px] w-full overflow-hidden rounded-full bg-slate-200/70">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${progress}%`, backgroundColor: COLOR.emerald }}
            />
          </div>
        </div>

        {/* Quy trình 5 bước */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[13px] font-bold text-[#0f172a]">Quy trình triển khai 5 bước</h3>
          <ul className="flex flex-col gap-2">
            {steps.map(({ no, task, owner, due, done }) => (
              <li
                key={no}
                className="flex flex-wrap items-center gap-3 rounded-[14px] border border-slate-200/80 bg-slate-50/70 px-4 py-3"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                    done ? "bg-[#10b981] text-white" : "bg-white text-[#64748b]"
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : no}
                </span>

                <div className="flex min-w-[200px] flex-1 flex-col gap-[2px]">
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
                  className={`inline-flex w-[130px] shrink-0 items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${
                    done ? "bg-[#10b981]/14 text-[#059669]" : "bg-white text-[#64748b]"
                  }`}
                >
                  {done ? <BadgeCheck size={12} strokeWidth={2.6} /> : <CircleSlash size={12} strokeWidth={2.6} />}
                  {done ? "Hoàn thành" : "Chưa bắt đầu"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bảng so sánh KPI (chỉ với kịch bản đã có số liệu) */}
        {kpiRows.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-bold text-[#0f172a]">Bảng so sánh KPI: Trước → Sau</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                <div className="flex items-center gap-3 rounded-t-[14px] border border-slate-200/80 bg-slate-50/70 px-4 py-[10px] text-[12px] font-semibold text-[#64748b]">
                  <span className="min-w-[200px] flex-1">Chỉ số KPI</span>
                  <span className="w-[140px] shrink-0 text-right">Trước</span>
                  <span className="w-[140px] shrink-0 text-right">Sau</span>
                  <span className="w-[150px] shrink-0 text-right">Chênh lệch</span>
                </div>

                {kpiRows.map((row, idx) => {
                  const delta = row.after - row.before;
                  const pct = (delta / row.before) * 100;
                  const digits = Math.abs(row.before) >= 1000 ? 0 : 3;

                  return (
                    <div
                      key={row.label}
                      className={`flex items-center gap-3 border-x border-b border-slate-200/80 bg-white/70 px-4 py-[12px] ${
                        idx === kpiRows.length - 1 ? "rounded-b-[14px]" : ""
                      }`}
                    >
                      <div className="flex min-w-[200px] flex-1 flex-col">
                        <span className="text-[13px] font-semibold text-[#0f172a]">{row.label}</span>
                        <span className="text-[11px] text-[#94a3b8]">{row.unit}</span>
                      </div>

                      <span className="w-[140px] shrink-0 text-right text-[13px] font-semibold text-[#94a3b8]">
                        {fmt(row.before, digits)}
                      </span>

                      <span className="w-[140px] shrink-0 text-right text-[13px] font-bold text-[#0f172a]">
                        {fmt(row.after, digits)}
                      </span>

                      <span className="flex w-[150px] shrink-0 justify-end">
                        <span className="inline-flex items-center gap-[5px] rounded-full bg-[#10b981]/12 px-[10px] py-[4px] text-[11px] font-bold text-[#059669]">
                          <TrendingDown size={12} strokeWidth={3} />
                          {fmt(delta, digits)} ({fmt(pct, 1)}%)
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Chân hộp thoại */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <span className="max-w-[520px] text-[11px] leading-[1.5] text-[#94a3b8]">
            {PROVENANCE_TEXT} · Quy trình và số liệu KPI dùng để lập kế hoạch nội bộ.
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#10b981] px-4 py-[10px] text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] ${FOCUS}`}
          >
            <Check size={15} strokeWidth={2.8} />
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Thẻ chỉ số (glass card) ────────────────────────────────── */
function MetricCard({ label, value, delta, note, accent, tone }) {
  return (
    <div className="relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-[16px] border border-white bg-[#f4f4f4] p-5 backdrop-blur-[15px]">
      <span
        className="absolute bottom-0 left-0 top-0 w-1"
        style={{ backgroundColor: accent }}
      />
      <p className="text-[13px] font-medium text-[#64748b]">{label}</p>
      <p className="text-[22px] font-bold text-[#0f172a]">{value}</p>
      <div className="flex items-center gap-[6px]">
        <span className={`rounded-[6px] px-2 py-[2px] text-[12px] font-semibold ${DELTA_STYLE[tone]}`}>
          {delta}
        </span>
        <span className="text-[12px] text-[#94a3b8]">{note}</span>
      </div>
    </div>
  );
}

/* ── Biểu đồ xu hướng phát thải ─────────────────────────────── */
function TrendChartCard() {
  const linePoints = TREND_POINTS.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <section className={`${CARD} flex min-w-0 flex-1 flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-[#0f172a]">Biểu đồ xu hướng phát thải</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span className="whitespace-nowrap text-[12px] text-[#64748b]">tấn CO2e phát thải</span>
          </span>
          <DataProvenanceTag compact />
        </div>
      </div>

      <svg
        viewBox="0 0 684 260"
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Biểu đồ đường thể hiện lượng phát thải CO2e theo 12 tháng"
      >
        {/* Lưới ngang + nhãn trục Y */}
        {Y_LABELS.map((label, i) => (
          <g key={label}>
            <line x1="0" x2="680" y1={i * 55 + 0.5} y2={i * 55 + 0.5} stroke={COLOR.line} />
            <text
              x="30"
              y={i * 55 + 0.5}
              textAnchor="end"
              dominantBaseline="central"
              fontSize="11"
              fill={COLOR.muted}
            >
              {label}
            </text>
          </g>
        ))}

        {/* Cột nền + đường xu hướng (vùng vẽ bắt đầu tại 40,20) */}
        <g transform="translate(40 20)">
          {TREND_BARS.map(([x, y, w, h]) => (
            <rect key={x} x={x} y={y} width={w} height={h} fill={COLOR.emerald} opacity="0.08" />
          ))}
          <polyline
            points={linePoints}
            fill="none"
            stroke={COLOR.emerald}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>

        {/* Nhãn trục X */}
        {X_LABELS.map((label, i) => (
          <text
            key={label}
            x={40 + (i / 11) * 640}
            y="240"
            textAnchor={i === 0 ? "start" : i === 11 ? "end" : "middle"}
            dominantBaseline="central"
            fontSize="11"
            fill={COLOR.muted}
          >
            {label}
          </text>
        ))}
      </svg>
    </section>
  );
}

/* ── Cơ cấu tiêu thụ tài nguyên (donut) ─────────────────────── */
function ResourceDonutCard() {
  const R = 59.5; // bán kính giữa vòng (ngoài 70, trong 49 → dày 21)
  const CIRC = 2 * Math.PI * R;
  let offset = 0;

  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`}>
      <h2 className="text-[15px] font-bold text-[#0f172a]">Cơ cấu tiêu thụ tài nguyên</h2>

      <div className="flex items-center gap-4">
        <div className="relative h-[140px] w-[140px] shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full" role="img" aria-label="Biểu đồ vòng cơ cấu tài nguyên">
            <circle cx="70" cy="70" r={R} fill="none" stroke={COLOR.line} strokeWidth="21" />
            {RESOURCES.map(({ label, value, color }) => {
              const len = (CIRC * value) / 100;
              const circle = (
                <circle
                  key={label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth="21"
                  strokeDasharray={`${len} ${CIRC - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 70 70)"
                />
              );
              offset += len;
              return circle;
            })}
          </svg>
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[2px] whitespace-nowrap">
            <span className="text-[18px] font-bold text-[#0f172a]">100%</span>
            <span className="text-[10px] text-[#64748b]">Tài nguyên</span>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-[6px]">
          {RESOURCES.map(({ label, value, color }) => (
            <li key={label} className="flex items-center gap-2">
              <span className="h-[10px] w-[10px] shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
              <span className="flex-1 text-[12px] font-medium text-[#0f172a]">{label}</span>
              <span className="whitespace-nowrap text-[12px] font-semibold text-[#64748b]">{value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Cảnh báo / chỉ số bất thường ───────────────────────────── */
function AlertsCard() {
  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`}>
      <h2 className="text-[15px] font-bold text-[#0f172a]">Cảnh báo / Chỉ số bất thường</h2>
      <ul className="flex flex-col gap-2">
        {ALERTS.map(({ title, desc, time, tone }) => (
          <li key={title} className="flex items-center gap-3 rounded-[8px] border border-[#e2e8f0] p-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ALERT_TONE[tone].bg}`}>
              <TriangleAlert size={18} strokeWidth={2} color={ALERT_TONE[tone].icon} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <p className="text-[13px] font-semibold text-[#0f172a]">{title}</p>
              <p className="text-[12px] text-[#64748b]">{desc}</p>
            </div>
            <span className="whitespace-nowrap text-[11px] text-[#94a3b8]">{time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Tải file vận hành ──────────────────────────────────────── */
function UploadCard() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFiles = (files) => {
    if (!files?.length) return;
    setFileName(files[0].name);
    // TODO: gửi files[0] lên API của bạn tại đây
  };

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-4 rounded-[16px] border border-dashed border-[#10b981] p-6 shadow-[0_2px_2px_rgba(0,0,0,0.02)] transition-colors ${
        dragging ? "bg-[#10b981]/5" : "bg-white"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981]/10">
        <CloudUpload size={24} strokeWidth={2} color={COLOR.emeraldDark} />
      </div>

      <div className="flex w-full flex-col items-center gap-1 text-center">
        <p className="text-[15px] font-bold text-[#0f172a]">Nhập dữ liệu / Tải file vận hành</p>
        <p className="text-[12px] text-[#64748b]">Kéo và thả tệp hoặc chọn file từ máy tính của bạn</p>
        <p className="text-[11px] text-[#94a3b8]">
          {fileName ? `Đã chọn: ${fileName}` : "Hỗ trợ các định dạng: .CSV, .Excel, .JSON (Tối đa 15MB)"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`rounded-[8px] bg-[#059669] px-6 py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#047857] ${FOCUS}`}
      >
        Tải lên tài liệu
      </button>
    </section>
  );
}

/* ── Khuyến nghị từ AI ──────────────────────────────────────── */
function AiSuggestionsCard() {
  return (
    <section className={`${CARD} flex flex-col gap-4 p-5`}>
      <div className="flex items-center gap-2">
        <Cpu size={20} strokeWidth={2} color={COLOR.emeraldDark} />
        <h2 className="text-[15px] font-bold text-[#0f172a]">Khuyến nghị đề xuất từ AI</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, title, desc }) => (
          <article
            key={title}
            className="flex flex-col gap-2 rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_2px_2px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#10b981]/10">
                <Icon size={16} strokeWidth={2} color={COLOR.emeraldDark} />
              </div>
              <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0f172a]">{title}</h3>
            </div>
            <p className="text-[12px] text-[#64748b]">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── Báo cáo hoạt động gần đây ──────────────────────────────── */
function RecentReportsCard() {
  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-[#e2e8f0] bg-[#f4f4f4] p-6 shadow-[0_2px_2px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-[#0f172a]">Báo cáo hoạt động gần đây</h2>
          <p className="text-[12px] text-[#64748b]">
            Theo dõi trạng thái các biểu mẫu khai báo vận hành &amp; môi trường
          </p>
        </div>
        <button
          type="button"
          className={`flex items-center gap-2 rounded-[8px] bg-[#10b981] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#0ea371] ${FOCUS}`}
        >
          <Download size={16} strokeWidth={2} color="#fff" />
          Xuất báo cáo
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px]" role="table" aria-label="Báo cáo hoạt động gần đây">
          {/* Header */}
          <div
            role="row"
            className="flex items-start gap-5 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-[10px] text-[12px] font-semibold text-[#64748b]"
          >
            <span role="columnheader" className="w-[120px] shrink-0">Thời gian</span>
            <span role="columnheader" className="w-[180px] shrink-0">Loại báo cáo</span>
            <span role="columnheader" className="min-w-0 flex-1">Mô tả chi tiết</span>
            <span role="columnheader" className="w-[120px] shrink-0">Trạng thái</span>
            <span role="columnheader" className="w-[100px] shrink-0">Hành động</span>
          </div>

          {/* Rows */}
          {REPORTS.map(({ time, type, desc, status, action }) => (
            <div
              key={time}
              role="row"
              className="flex items-center gap-5 border-b border-[#e2e8f0] px-4 py-3 text-[13px]"
            >
              <span role="cell" className="w-[120px] shrink-0 text-[#0f172a]">{time}</span>
              <span role="cell" className="w-[180px] shrink-0 font-semibold text-[#0f172a]">{type}</span>
              <span role="cell" className="min-w-0 flex-1 truncate text-[#64748b]">{desc}</span>
              <span role="cell" className="w-[120px] shrink-0">
                <span className={`inline-flex rounded-[6px] px-[10px] py-1 text-[12px] font-semibold ${STATUS[status].cls}`}>
                  {STATUS[status].label}
                </span>
              </span>
              <span role="cell" className="w-[100px] shrink-0">
                <button
                  type="button"
                  className={`whitespace-nowrap text-[13px] font-semibold text-[#059669] hover:underline ${FOCUS}`}
                >
                  {action}
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   4. TRANG TỔNG QUAN (Dashboard)
   ──────────────────────────────────────────────────────────────── */
function OverviewPage({ onGoToAI }) {
  // Khối "Top 3 việc cần làm ngay" mở Action Plan dạng hộp thoại ngay trên Dashboard
  const [planItem, setPlanItem] = useState(null);

  return (
    <main className="glass flex min-h-[calc(100vh-73px)] min-w-0 flex-1 flex-col gap-6 p-6">
          {/* Tiêu đề trang */}
          <div className="flex flex-col gap-[6px]">
            <h1 className="text-[24px] font-extrabold text-[#0f172a]">{PAGE_TITLE}</h1>
            <p className="text-[14px] text-[#64748b]">{PAGE_SUBTITLE}</p>
          </div>

          {/* Khối nổi bật: Top 3 việc cần làm ngay trong tháng */}
          <ActionablePrioritiesCard
            onOpenPlan={(item) => setPlanItem(item)}
            onGoToAI={onGoToAI}
          />

          {/* Hàng chỉ số */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {METRICS.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          {/* Biểu đồ + cột phải */}
          <div className="flex flex-col items-start gap-5 xl:flex-row">
            <TrendChartCard />
            <div className="flex w-full shrink-0 flex-col gap-5 xl:w-[420px]">
              <ResourceDonutCard />
              <AlertsCard />
            </div>
          </div>

          {/* Tải file + khuyến nghị AI */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <UploadCard />
            <AiSuggestionsCard />
          </div>

          {/* Bảng báo cáo */}
          <RecentReportsCard />

          {/* Hộp thoại Action Plan 5 bước của Ưu tiên 01 */}
          {planItem && (
            <ActionPlanModal item={planItem} onClose={() => setPlanItem(null)} />
          )}
        </main>
  );
}

/* ────────────────────────────────
   5. TRANG ECOMETRIC – điều phối theo tab ở Sidebar
   ──────────────────────────────── */
export default function App() {
  const [activeNav, setActiveNav] = useState("overview");

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Inter',ui-sans-serif,system-ui,sans-serif] leading-[normal] text-[#0f172a] antialiased">
      <Topbar />

      {/* main-container: lớp kính mờ nền (Figma: blur 15px, trắng 30%) */}
      <div className="flex items-start bg-white/30 backdrop-blur-[15px]">
        <Sidebar active={activeNav} onChange={setActiveNav} />

        {activeNav === "operations" ? (
          <DataInput />
        ) : activeNav === "carbon" ? (
          <CarbonEmissions />
        ) : activeNav === "ai" ? (
          <AIRecommendations />
        ) : activeNav === "esg" ? (
          <ESGReporting />
        ) : activeNav === "settings" ? (
          <Settings />
        ) : (
          <OverviewPage onGoToAI={() => setActiveNav("ai")} />
        )}
      </div>
    </div>
  );
}