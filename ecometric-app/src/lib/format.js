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

// Lớp bề mặt kính. `card` cho thẻ/khối, `modal` cho hộp thoại Action Plan.
// Bo góc tăng dần theo breakpoint để mềm mại kiểu Mobile OS.
export const GLASS = {
  card: "bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-2xl",
  modal:
    "bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl sm:rounded-3xl",
};

// Class dùng lại nhiều lần – bo góc mềm (mobile-first)
export const CARD =
  "bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_2px_2px_rgba(0,0,0,0.02)] sm:rounded-[16px]";

export const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]";

// Nút Primary Action dùng chung cho thẻ ưu tiên & modal.
// min-h-[44px]: chạm thoải mái theo chuẩn iOS HIG / Android Material.
export const BTN_PRIMARY = `inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-[#10b981] px-4 text-[13px] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.7)] transition-all hover:bg-[#0ea371] hover:shadow-[0_10px_22px_-8px_rgba(16,185,129,0.75)] active:scale-[0.97] ${FOCUS}`;

export const BTN_GHOST = `inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] transition-all hover:bg-[#f8fafc] active:scale-[0.97] ${FOCUS}`;

/* ── Nhận diện dữ liệu ─────────────────────────────────────────── */
export const GRID_FACTOR = 0.6766;
export const PROVENANCE_TEXT =
  "Dữ liệu mô phỏng theo Hệ số Lưới điện VN 2024 (0.6766 kg CO₂e/kWh)";

export const DELTA_STYLE = {
  good: "bg-[#10b981]/10 text-[#059669]",
  bad: "bg-[#fee2e2] text-[#991b1b]",
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
