/**
 * RecentReportsList – "Báo cáo hoạt động gần đây"
 *
 * Responsive:
 *  · Mobile (< 768px)  : DANH SÁCH THẺ (Card List) – không còn cuộn ngang,
 *    mỗi báo cáo là 1 thẻ dọc gồm tiêu đề, mô tả, badge trạng thái và nút hành động.
 *  · ≥ 768px (md)      : BẢNG co giãn theo bề rộng – KHÔNG cuộn ngang trên tablet.
 *  · ≥ 1024px (lg)     : BẢNG bề rộng rộng rãi như thiết kế gốc.
 *
 * Cả hai chế độ dùng CHUNG một nguồn dữ liệu `REPORTS`.
 */
import { Download, FileText } from "lucide-react";
import { BTN_PRIMARY, FOCUS, STATUS } from "../lib/format.js";

/* ── Badge trạng thái dùng chung cho cả 2 chế độ ────────────────── */
function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center rounded-lg px-[10px] py-1 text-[11px] font-semibold sm:text-[12px] ${STATUS[status].cls}`}
    >
      {STATUS[status].label}
    </span>
  );
}

/* ── Chế độ MOBILE: danh sách thẻ dọc ───────────────────────────── */
function ReportCards({ reports }) {
  return (
    <ul
      className="flex flex-col gap-3 md:hidden"
      aria-label="Báo cáo hoạt động gần đây"
    >
      {reports.map(({ time, type, desc, status, action }) => (
        <li
          key={time}
          className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_2px_8px_-6px_rgba(15,23,42,0.2)] transition-all hover:shadow-[0_10px_24px_-14px_rgba(15,23,42,0.3)] active:scale-[0.995]"
        >
          {/* Hàng đầu: loại báo cáo + mô tả */}
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#10b981]/12">
              <FileText size={17} strokeWidth={2.2} color="#059669" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="text-[14px] font-bold leading-snug text-[#0f172a]">
                {type}
              </h3>
              <p className="text-[12px] leading-snug text-[#64748b]">{desc}</p>
            </div>
          </div>

          {/* Hàng meta: thời gian + trạng thái */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f1f5f9] pt-3">
            <span className="text-[11px] font-medium text-[#94a3b8]">
              {time}
            </span>
            <StatusBadge status={status} />
          </div>

          {/* Hành động: nút rộng, đủ vùng chạm */}
          <button
            type="button"
            className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-2xl border border-[#d1fae5] bg-[#10b981]/10 px-4 text-[13px] font-semibold text-[#059669] transition-all hover:bg-[#10b981]/16 active:scale-[0.97] ${FOCUS}`}
          >
            {action}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ── Chế độ DESKTOP/TABLET: bảng ────────────────────────────────────
 * Tablet (md → lg): cột co giãn, KHÔNG cuộn ngang.
 *   · Bỏ `min-w` cứng; giảm gap/padding; cột "Thời gian" & "Loại báo cáo"
 *     dùng bề rộng linh hoạt; cột "Hành động" thu về auto.
 * Desktop (≥ lg): mới áp bề rộng rộng rãi như thiết kế gốc.
 */
function ReportTable({ reports }) {
  return (
    <div className="hidden md:block">
      <div role="table" aria-label="Báo cáo hoạt động gần đây">
        {/* Header */}
        <div
          role="row"
          className="flex items-start gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px] text-[12px] font-semibold text-[#64748b] lg:gap-5 lg:px-4"
        >
          <span role="columnheader" className="w-[86px] shrink-0 lg:w-[120px]">
            Thời gian
          </span>
          <span role="columnheader" className="w-[130px] shrink-0 lg:w-[180px]">
            Loại báo cáo
          </span>
          <span role="columnheader" className="min-w-0 flex-1">
            Mô tả chi tiết
          </span>
          <span role="columnheader" className="w-[104px] shrink-0 lg:w-[120px]">
            Trạng thái
          </span>
          <span role="columnheader" className="shrink-0 lg:w-[100px]">
            Hành động
          </span>
        </div>

        {/* Rows */}
        {reports.map(({ time, type, desc, status, action }) => (
          <div
            key={time}
            role="row"
            className="flex items-center gap-3 border-b border-[#e2e8f0] px-3 py-3 text-[13px] transition-colors hover:bg-[#f8fafc] lg:gap-5 lg:px-4"
          >
            <span
              role="cell"
              className="w-[86px] shrink-0 whitespace-nowrap text-[#0f172a] lg:w-[120px]"
            >
              {time}
            </span>
            <span
              role="cell"
              className="w-[130px] shrink-0 font-semibold text-[#0f172a] lg:w-[180px]"
            >
              {type}
            </span>
            <span
              role="cell"
              className="min-w-0 flex-1 truncate text-[#64748b]"
            >
              {desc}
            </span>
            <span role="cell" className="w-[104px] shrink-0 lg:w-[120px]">
              <StatusBadge status={status} />
            </span>
            <span role="cell" className="shrink-0 lg:w-[100px]">
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
  );
}

/* ── Khối bao quanh ─────────────────────────────────────────────── */
export default function RecentReportsList({ reports }) {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-[#f4f4f4] p-4 shadow-[0_2px_2px_rgba(0,0,0,0.02)] sm:p-6"
      aria-labelledby="recent-reports-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2
            id="recent-reports-title"
            className="text-[15px] font-bold text-[#0f172a] sm:text-[16px]"
          >
            Báo cáo hoạt động gần đây
          </h2>
          <p className="text-[12px] leading-snug text-[#64748b]">
            Theo dõi trạng thái các biểu mẫu khai báo vận hành &amp; môi trường
          </p>
        </div>

        {/* Mobile: nút full-width; Desktop: nút vừa phải */}
        <button
          type="button"
          className={`${BTN_PRIMARY} sm:min-h-[40px] sm:w-auto`}
        >
          <Download size={16} strokeWidth={2} color="#fff" />
          Xuất báo cáo
        </button>
      </div>

      <ReportCards reports={reports} />
      <ReportTable reports={reports} />
    </section>
  );
}
