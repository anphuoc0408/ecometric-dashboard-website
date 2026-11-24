/**
 * EcoMetric – Hàm định dạng & design tokens dùng chung
 * Tách từ App.jsx để mọi component có thể import mà không tạo vòng lặp.
 */

/* ── Định dạng số / tiền tệ (vi-VN) ─────────────────────────────── */
export function fmt(n, digits = 1) {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtInt(n) {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

// Rút gọn chi phí: 15,00 triệu VNĐ / 2,85 tỷ VNĐ
export function fmtMoney(n) {
  if (n === undefined || n === null) return "0 VNĐ";
  if (n >= 1_000_000_000) return `${fmt(n / 1_000_000_000, 2)} tỷ VNĐ`;
  if (n >= 1_000_000) return `${fmt(n / 1_000_000, 2)} triệu VNĐ`;
  return `${fmtInt(n)} VNĐ`;
}

/* ── Design tokens ──────────────────────────────────────────────── */
export const COLOR = {
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

// Lớp bề mặt thẻ/khối và modal
export const GLASS = {
  card: "bg-white border border-slate-200/90 shadow-xs rounded-xl",
  modal:
    "bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl sm:rounded-3xl",
};

// Class dùng lại nhiều lần – giao diện SaaS B2B viền mảnh, nền trắng sạch
export const CARD =
  "bg-white border border-slate-200/90 rounded-xl shadow-xs";

export const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

// Nút Primary Action dùng chung cho thẻ ưu tiên & modal.
export const BTN_PRIMARY = `inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-[0.98] ${FOCUS}`;

export const BTN_GHOST = `inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] ${FOCUS}`;

/* ── Nhận diện dữ liệu ─────────────────────────────────────────── */
export const GRID_FACTOR = 0.6766;
export const PROVENANCE_TEXT =
  "Dữ liệu mô phỏng theo Hệ số Lưới điện VN 2024 (0.6766 kg CO₂e/kWh)";

export const DELTA_STYLE = {
  good: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  bad: "bg-rose-50 text-rose-700 border border-rose-200/70",
};

export const STATUS = {
  done: { label: "Hoàn thành", cls: "bg-[#10b981]/10 text-[#059669]" },
  processing: { label: "Đang xử lý", cls: "bg-[#fef3c7] text-[#d97706]" },
  error: { label: "Lỗi", cls: "bg-[#fee2e2] text-[#991b1b]" },
};

export const ALERT_TONE = {
  red: { bg: "bg-[#fee2e2]", icon: COLOR.red },
  amber: { bg: "bg-[#fef3c7]", icon: COLOR.amber },
};
