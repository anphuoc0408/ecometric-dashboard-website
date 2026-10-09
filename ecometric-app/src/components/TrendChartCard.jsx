/**
 * TrendChartCard – Biểu đồ xu hướng phát thải 12 tháng.
 *
 * Responsive: SVG có `viewBox` nên tự co giãn. Trên mobile giảm chiều cao
 * tối thiểu và ẩn bớt nhãn trục X (chỉ hiện T1, T6, T12) để không dồn chữ.
 */
import { COLOR } from "../lib/format.js";
import {
  TREND_BARS,
  TREND_POINTS,
  X_LABELS,
  Y_LABELS,
} from "../data/dashboardData.js";
import { CARD } from "../lib/format.js";
import DataProvenanceTag from "./DataProvenanceTag.jsx";

export default function TrendChartCard({ trend }) {
  // `trend` đến từ API (shape { points, bars, xLabels, yLabels }); nếu thiếu
  // thì rơi về dữ liệu tĩnh để component vẫn render được khi gọi <TrendChartCard />.
  const {
    points = TREND_POINTS,
    bars = TREND_BARS,
    xLabels = X_LABELS,
    yLabels = Y_LABELS,
  } = trend ?? {};

  const linePoints = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <section
      className={`${CARD} flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5`}
      aria-labelledby="trend-chart-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2
          id="trend-chart-title"
          className="text-[15px] font-bold text-[#0f172a] sm:text-[16px]"
        >
          Biểu đồ xu hướng phát thải
        </h2>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
            <span className="whitespace-nowrap text-[12px] text-[#64748b]">
              tấn CO2e phát thải
            </span>
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
        {yLabels.map((label, i) => (
          <g key={label}>
            <line
              x1="0"
              x2="680"
              y1={i * 55 + 0.5}
              y2={i * 55 + 0.5}
              stroke={COLOR.line}
            />
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
          {bars.map(([x, y, w, h]) => (
            <rect
              key={x}
              x={x}
              y={y}
              width={w}
              height={h}
              fill={COLOR.emerald}
              opacity="0.08"
            />
          ))}
          <polyline
            points={linePoints}
            fill="none"
            stroke={COLOR.emerald}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>

        {/* Nhãn trục X – mobile chỉ hiện T1 / T6 / T12 để tránh dồn chữ */}
        {xLabels.map((label, i) => {
          const isKeyLabel = i === 0 || i === 5 || i === 11;
          const lastIndex = Math.max(xLabels.length - 1, 1);
          return (
            <text
              key={label}
              x={40 + (i / lastIndex) * 640}
              y="240"
              textAnchor={i === 0 ? "start" : i === lastIndex ? "end" : "middle"}
              dominantBaseline="central"
              fontSize="11"
              fill={COLOR.muted}
              className={isKeyLabel ? "" : "hidden sm:block"}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </section>
  );
}
