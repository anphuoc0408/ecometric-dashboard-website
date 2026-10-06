/**
 * MetricsCard – Thẻ chỉ số KPI (Top Metrics)
 *
 * Responsive (chế độ mặc định – Grid):
 *  · Mobile (< 640px) : GRID 2×2 (grid-cols-2) – luôn thấy đủ 4 KPI, không cuộn.
 *  · ≥ 640px (sm)     : 2 cột.
 *  · ≥ 1280px (xl)    : 4 cột ngang.
 *
 * Chế độ `carousel` (tuỳ chọn): thẻ rộng 78% khi < sm, 45% từ sm, tự chia đều từ xl.
 * Lưu ý: dự án KHÔNG định nghĩa breakpoint `xs` — mọi mốc dùng sm/md/lg/xl chuẩn Tailwind.
 *
 * Ghi chú: chữ số dùng `tabular-nums` để các cột số không "nhảy" khi giá trị đổi.
 */
import { DELTA_STYLE, FOCUS } from "../lib/format.js";

export function MetricCard({ label, value, delta, note, accent, tone }) {
  return (
    <article
      className={`group relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-white bg-white/70 p-4 backdrop-blur-[15px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_12px_28px_-14px_rgba(15,23,42,0.3)] sm:p-5 ${FOCUS}`}
    >
      {/* Vệt màu nhận diện chỉ số */}
      <span
        className="absolute bottom-0 left-0 top-0 w-1 rounded-full"
        style={{ backgroundColor: accent }}
      />

      <p className="text-[12px] font-medium leading-snug text-[#64748b] sm:text-[13px]">
        {label}
      </p>

      <p className="text-[17px] font-bold leading-tight tracking-tight text-[#0f172a] tabular-nums sm:text-[22px]">
        {value}
      </p>

      {/* Delta có thể xuống dòng trên màn hẹp nên dùng flex-wrap */}
      <div className="mt-auto flex flex-wrap items-center gap-x-[6px] gap-y-1">
        <span
          className={`shrink-0 rounded-lg px-2 py-[3px] text-[11px] font-semibold tabular-nums sm:text-[12px] ${DELTA_STYLE[tone]}`}
        >
          {delta}
        </span>
        <span className="min-w-0 text-[11px] leading-snug text-[#94a3b8] sm:text-[12px]">
          {note}
        </span>
      </div>
    </article>
  );
}

/**
 * MetricsGrid – Lưới 4 KPI.
 *
 * Bật `carousel` (tuỳ chọn) để dùng dạng scroll ngang snap:
 *   <MetricsGrid metrics={METRICS} carousel />
 * Mặc định dùng Grid 2×2 – gọn và dễ quét mắt hơn trên mobile.
 */
export default function MetricsGrid({ metrics, carousel = false }) {
  if (carousel) {
    return (
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Chỉ số tổng quan"
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            role="listitem"
            className="w-[78%] shrink-0 snap-start sm:w-[45%] xl:w-auto xl:flex-1"
          >
            <MetricCard {...m} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      role="list"
      aria-label="Chỉ số tổng quan"
    >
      {metrics.map((m) => (
        <div key={m.label} role="listitem" className="min-w-0">
          <MetricCard {...m} />
        </div>
      ))}
    </div>
  );
}
