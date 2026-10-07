/**
 * EcoMetric – Dữ liệu tĩnh của trang Tổng quan (Dashboard)
 * Tách từ App.jsx. Thay bằng lời gọi API khi backend sẵn sàng.
 */
import {
  Activity,
  Cpu,
  Database,
  Droplet,
  FileText,
  Flame,
  Lightbulb,
  PanelsTopLeft,
  RefreshCw,
  Settings as SettingsIcon,
  TrendingUp,
  Zap,
} from "lucide-react";
import { COLOR, fmtMoney } from "../lib/format.js";

/* ── Avatar & tiêu đề trang ─────────────────────────────────────── */
// Ảnh đại diện dự phòng dạng SVG (data-URI) – luôn hiển thị được,
// không phụ thuộc mạng nên không bao giờ bị "ảnh vỡ".
// Chữ cái & màu nền đồng bộ với UI-Avatars của các tài khoản khác.
export const AVATAR_FALLBACK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
     <rect width="96" height="96" rx="48" fill="#10b981"/>
     <text x="48" y="49" text-anchor="middle" dominant-baseline="central"
           font-family="Inter, Segoe UI, sans-serif" font-size="36" font-weight="700"
           fill="#ffffff">NA</text>
   </svg>`,
)}`;

// Ảnh avatar chính. Link Figma cũ đã hỏng (chỉ sống 7 ngày) nên thay bằng
// ảnh đại diện sinh từ tên qua UI-Avatars. Khi có ảnh thật, tải về /public
// rồi đổi giá trị này thành "/avatar.png".
export const AVATAR_URL =
  "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=10b981&color=fff";

export const PAGE_TITLE = "CANVAS MẪU THIẾT KẾ WEB ECOMETRIC";
export const PAGE_SUBTITLE =
  "Bố cục tham khảo cho dashboard quản lý dữ liệu vận hành, phát thải và khuyến nghị tối ưu";

/* ── Điều hướng ─────────────────────────────────────────────────── */
export const NAV_ITEMS = [
  { id: "overview", label: "Tổng quan", icon: PanelsTopLeft },
  { id: "operations", label: "Dữ liệu vận hành", bottomLabel: "Vận hành", icon: Database },
  { id: "carbon", label: "Phát thải carbon", bottomLabel: "Carbon", icon: Activity },
  { id: "ai", label: "Khuyến nghị AI", bottomLabel: "AI", icon: Cpu },
  { id: "esg", label: "Báo cáo ESG", bottomLabel: "ESG", icon: FileText },
  { id: "settings", label: "Cài đặt", icon: SettingsIcon },
];

/**
 * Bottom navigation mobile: đủ 6 mục (bao gồm Cài đặt).
 * Nhãn ngắn `bottomLabel` + class điều chỉnh cỡ chữ giúp 6 tab vẫn hiển thị
 * trọn vẹn trên màn hình 390px mà không bị đè hay tràn chữ.
 */
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.map((item) => ({
  ...item,
  navLabel: item.bottomLabel ?? item.label,
}));

/* ── Kịch bản LED Xưởng 1 – bộ số chuẩn (nguồn: AIRecommendations.jsx) ── */
export const LED_RETROFIT_CASE = {
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

/* ── Top 3 việc cần làm ngay trong tháng ───────────────────────── */
export const ACTIONABLE_PRIORITIES = [
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

/* ── Top KPI metrics ────────────────────────────────────────────── */
export const METRICS = [
  {
    label: "Tổng phát thải CO2e",
    value: "1,245.8 tấn CO2e",
    delta: "-12.4%",
    note: "so với tháng trước",
    accent: COLOR.emerald,
    tone: "good",
  },
  {
    label: "Chi phí vận hành",
    value: "482,900,000 VNĐ",
    delta: "-4.2%",
    note: "so với tháng trước",
    accent: COLOR.blue,
    tone: "good",
  },
  {
    label: "Dữ liệu tháng này",
    value: "2,480 bản ghi",
    delta: "+18.5%",
    note: "so với tháng trước",
    accent: COLOR.amber,
    tone: "good",
  },
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

/* ── Toạ độ biểu đồ xu hướng (lấy nguyên từ vector Figma 640 × 180) ── */
export const TREND_POINTS = [
  [0.4, 85.3],
  [58.4, 102.4],
  [116.1, 63.6],
  [174.9, 125.8],
  [232.0, 29.6],
  [291.1, 1.4],
  [349.7, 46.4],
  [407.7, 69.4],
  [465.8, 108.4],
  [524.7, 142.4],
  [582.5, 170.3],
  [640.3, 181.2],
];

export const TREND_BARS = [
  [0, 95.7, 59, 87],
  [58, 84.7, 59, 98],
  [116, 95.7, 60, 87],
  [175, 78.7, 59, 104],
  [233, 16.7, 59, 166],
  [291, 25.7, 59, 157],
  [349, 59.7, 59, 123],
  [407, 90.7, 59, 92],
  [465, 126.7, 60, 56],
  [524, 157.7, 59, 25],
  [582, 177.7, 59, 5],
];

export const Y_LABELS = [60, 45, 30, 15, 0];
export const X_LABELS = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

/* ── Cơ cấu tiêu thụ tài nguyên (donut) ─────────────────────────── */
export const RESOURCES = [
  { label: "Điện năng", value: 40, color: COLOR.emerald },
  { label: "Nước", value: 25, color: COLOR.blue },
  { label: "Nhiên liệu", value: 20, color: COLOR.amber },
  { label: "Nguyên liệu", value: 10, color: COLOR.violet },
  { label: "Khác", value: 5, color: COLOR.slate },
];

/* ── Cảnh báo / chỉ số bất thường ───────────────────────────────── */
export const ALERTS = [
  {
    title: "Quá tải điện năng",
    desc: "Khu vực sản xuất vượt ngưỡng 15% hạn mức",
    time: "Hôm nay",
    tone: "red",
  },
  {
    title: "Thất thoát nước đột ngột",
    desc: "Ghi nhận lưu lượng tăng lạ tại xưởng B",
    time: "Hôm qua",
    tone: "red",
  },
  {
    title: "Phụ phẩm chưa xử lý",
    desc: "Hệ thống lưu trữ sắp đạt công suất tối đa",
    time: "2 ngày trước",
    tone: "amber",
  },
];

/* ── Khuyến nghị từ AI ──────────────────────────────────────────── */
export const SUGGESTIONS = [
  {
    icon: Zap,
    title: "Gợi ý 1: Tối ưu điện",
    desc: "Điều chỉnh khung giờ cao điểm hoạt động thiết bị.",
  },
  {
    icon: Droplet,
    title: "Gợi ý 2: Giảm thất thoát",
    desc: "Kiểm soát các đầu van khóa tại khu B định kỳ.",
  },
  {
    icon: RefreshCw,
    title: "Gợi ý 3: Phụ phẩm",
    desc: "Tái chế xơ dừa làm vật liệu sinh học lót sàn.",
  },
  {
    icon: TrendingUp,
    title: "Gợi ý 4: Tối ưu quy trình",
    desc: "Số hóa toàn bộ hồ sơ khai báo để loại bỏ giấy.",
  },
];

/* ── Báo cáo hoạt động gần đây ──────────────────────────────────── */
export const REPORTS = [
  {
    time: "10:24 - 12/10",
    type: "Báo cáo CO2 Tháng 9",
    desc: "Khai báo dữ liệu khí thải trực tiếp và gián tiếp của toàn bộ nhà xưởng.",
    status: "done",
    action: "Xem chi tiết",
  },
  {
    time: "09:15 - 11/10",
    type: "Hao phí Tài nguyên nước",
    desc: "Thống kê lượng nước sử dụng cho dệt nhuộm và sinh hoạt công nhân.",
    status: "processing",
    action: "Chỉnh sửa",
  },
  {
    time: "16:30 - 08/10",
    type: "Báo cáo Rác thải Rắn",
    desc: "Phân loại phụ phẩm công nghiệp và rác thải nguy hại định kỳ.",
    status: "done",
    action: "Xem chi tiết",
  },
  {
    time: "14:00 - 05/10",
    type: "Khai trình ESG Q3",
    desc: "Tổng hợp các chỉ số phát triển bền vững trình ban giám đốc.",
    status: "done",
    action: "Xem chi tiết",
  },
  {
    time: "11:45 - 02/10",
    type: "Kiểm kê Khí nhà kính",
    desc: "Dữ liệu phát thải phát sinh từ đội xe vận tải logistics.",
    status: "error",
    action: "Gửi lại",
  },
];

/* ── Quy trình 5 bước của Action Plan ───────────────────────────── */
export const ACTION_PLAN_STEPS = {
  led: [
    {
      no: 1,
      task: "Khảo sát hiện trạng & đo đạc độ rọi Xưởng 1",
      owner: "Kỹ thuật Xưởng 1",
      due: "05/11/2025",
      done: true,
    },
    {
      no: 2,
      task: "Lập danh mục vật tư, báo giá 100 bộ LED tuýp 18W",
      owner: "Ban Thu mua",
      due: "07/11/2025",
      done: true,
    },
    {
      no: 3,
      task: "Phê duyệt CAPEX 15.000.000 VNĐ",
      owner: "Ban Giám đốc",
      due: "10/11/2025",
      done: false,
    },
    {
      no: 4,
      task: "Thi công thay thế 100 bóng, theo từng khu vực",
      owner: "Đội Cơ điện",
      due: "18/11/2025",
      done: false,
    },
    {
      no: 5,
      task: "Nghiệm thu, đo lại độ rọi & chốt số kWh tiết kiệm",
      owner: "Ban Năng lượng",
      due: "21/11/2025",
      done: false,
    },
  ],
  generic: [
    {
      no: 1,
      task: "Xác nhận hiện trạng và phạm vi can thiệp",
      owner: "Kỹ thuật nhà xưởng",
      due: "Đang cập nhật",
      done: false,
    },
    {
      no: 2,
      task: "Lập phương án kỹ thuật & dự toán",
      owner: "Ban Kỹ thuật",
      due: "Đang cập nhật",
      done: false,
    },
    {
      no: 3,
      task: "Phê duyệt phương án và bố trí nguồn lực",
      owner: "Ban Giám đốc",
      due: "Đang cập nhật",
      done: false,
    },
    {
      no: 4,
      task: "Thi công theo phương án đã duyệt",
      owner: "Đội Cơ điện",
      due: "Đang cập nhật",
      done: false,
    },
    {
      no: 5,
      task: "Nghiệm thu & đo lường kết quả tiết kiệm",
      owner: "Ban Năng lượng",
      due: "Đang cập nhật",
      done: false,
    },
  ],
};

/* ── Bảng so sánh KPI trước → sau (chỉ với kịch bản LED) ────────── */
export const KPI_ROWS_LED = [
  {
    label: "Điện năng tiêu thụ Xưởng 1",
    unit: "kWh/tháng",
    before: 20_000,
    after: 18_944,
  },
  {
    label: "Phát thải từ chiếu sáng Xưởng 1",
    unit: "tCO2e/tháng",
    before: 13.53,
    after: 12.818,
  },
  { label: "Công suất chiếu sáng", unit: "kW", before: 4.0, after: 1.8 },
];
