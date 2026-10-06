/**
 * ResourceDonutCard – "Cơ cấu tiêu thụ tài nguyên" (Donut Chart)
 *
 * Responsive:
 *  · Mobile (< 640px) : biểu đồ ở trên, CHÚ THÍCH (Legend) XUỐNG DƯỚI,
 *    legend chuyển thành 2 cột để tận dụng chiều rộng.
 *  · ≥ 640px          : biểu đồ bên trái, legend bên phải (như thiết kế gốc).
 */
import { COLOR } from "../lib/format.js";

/* ── Phần vẽ vòng donut (SVG thuần, không cần thư viện) ─────────── */
function DonutRing({ resources }) {
  const R = 59.5; // bán kính giữa vòng (ngoài 70, trong 49 → dày 21)
  const CIRC = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="relative mx-auto h-[132px] w-[132px] shrink-0 sm:h-[140px] sm:w-[140px]">
      <svg
        viewBox="0 0 140 140"
        className="h-full w-full"
        role="img"
        aria-label="Biểu đồ vòng cơ cấu tài nguyên"
      >
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke={COLOR.line}
          strokeWidth="21"
        />

        {resources.map(({ label, value, color }) => {
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

      <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[2px] whitespace-nowrap">
        <span className="text-[18px] font-bold tabular-nums text-[#0f172a]">
          100%
        </span>
        <span className="text-[10px] text-[#64748b]">Tài nguyên</span>
      </div>
    </div>
  );
}

/* ── Chú thích (Legend) ─────────────────────────────────────────── */
function DonutLegend({ resources }) {
  return (
    <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1 sm:gap-y-[6px]">
      {resources.map(({ label, value, color }) => (
        <li key={label} className="flex min-w-0 items-center gap-2">
          <span
            className="h-[10px] w-[10px] shrink-0 rounded-[3px]"
            style={{ backgroundColor: color }}
          />
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#0f172a]">
            {label}
          </span>
          <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[#64748b]">
            {value}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ResourceDonutCard({ resources }) {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_2px_2px_rgba(0,0,0,0.02)]"
      aria-labelledby="resource-donut-title"
    >
      <h2
        id="resource-donut-title"
        className="text-[15px] font-bold text-[#0f172a]"
      >
        Cơ cấu tiêu thụ tài nguyên
      </h2>

      {/*
        Mobile: flex-col (biểu đồ trên → legend dưới).
        ≥ 640px: flex-row (biểu đồ trái → legend phải).
      */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <DonutRing resources={resources} />
        <DonutLegend resources={resources} />
      </div>
    </section>
  );
}
