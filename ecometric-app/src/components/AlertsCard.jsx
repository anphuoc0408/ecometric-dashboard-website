/**
 * AlertsCard – Cảnh báo / Chỉ số bất thường.
 *
 * Props: `alerts` – mảng cảnh báo (mặc định lấy từ dashboardData.js để
 * tương thích ngược với call-site cũ <AlertsCard />).
 *
 * Responsive: trên mobile chỉ icon + nội dung; nhãn thời gian xuống
 * cùng hàng với tiêu đề (tránh bị bóp chữ khi màn hẹp).
 */
import { TriangleAlert } from "lucide-react";
import { ALERT_TONE, CARD } from "../lib/format.js";
import { ALERTS } from "../data/dashboardData.js";

export default function AlertsCard({ alerts = ALERTS }) {
  return (
    <section
      className={`${CARD} flex flex-col gap-3 p-4`}
      aria-labelledby="alerts-card-title"
    >
      <h2
        id="alerts-card-title"
        className="text-[15px] font-bold text-[#0f172a]"
      >
        Cảnh báo / Chỉ số bất thường
      </h2>

      <ul className="flex flex-col gap-2">
        {alerts.map(({ title, desc, time, tone }) => (
          <li
            key={title}
            className="flex items-start gap-3 rounded-2xl border border-[#e2e8f0] p-3 transition-colors hover:bg-[#f8fafc]"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ALERT_TONE[tone].bg}`}
            >
              <TriangleAlert
                size={18}
                strokeWidth={2}
                color={ALERT_TONE[tone].icon}
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              {/* Tiêu đề + thời gian cùng hàng, tự xuống dòng khi hẹp */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-[2px]">
                <p className="min-w-0 text-[13px] font-semibold text-[#0f172a]">
                  {title}
                </p>
                <span className="shrink-0 text-[11px] text-[#94a3b8]">
                  {time}
                </span>
              </div>
              <p className="text-[12px] leading-snug text-[#64748b]">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
