/**
 * ActionPlanModal – Hộp thoại Action Plan 5 bước (đồng bộ với AIRecommendations.jsx).
 *
 * Responsive:
 *  · Mobile: hộp thoại full-width, bảng KPI chuyển từ hàng ngang sang
 *    từng thẻ dọc (không cần cuộn ngang), các bước xếp dọc gọn gàng.
 *  · ≥ 640px: bảng KPI dạng lưới cột như thiết kế gốc.
 */
import {
  BadgeCheck,
  Check,
  CircleSlash,
  ClipboardList,
  TrendingDown,
  X,
} from "lucide-react";
import { COLOR, FOCUS, GLASS, PROVENANCE_TEXT, fmt } from "../lib/format.js";
import { ACTION_PLAN_STEPS, KPI_ROWS_LED } from "../data/dashboardData.js";
import DataProvenanceTag from "./DataProvenanceTag.jsx";

/* ── Một bước trong quy trình ───────────────────────────────────── */
function StepItem({ step }) {
  const { no, task, owner, due, done } = step;
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3 sm:px-4">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
          done ? "bg-[#10b981] text-white" : "bg-white text-[#64748b]"
        }`}
      >
        {done ? <Check size={14} strokeWidth={3} /> : no}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[13px] font-semibold leading-[1.4] text-[#0f172a]">
          {task}
        </span>
        <span className="text-[11px] text-[#94a3b8]">Bước {no}/5</span>

        {/* Người phụ trách + hạn: xuống dòng trên mobile, cùng hàng từ sm */}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-baseline gap-[6px]">
            <span className="text-[10px] text-[#94a3b8]">Phụ trách:</span>
            <span className="text-[12px] font-semibold text-[#0f172a]">
              {owner}
            </span>
          </span>
          <span className="flex items-baseline gap-[6px]">
            <span className="text-[10px] text-[#94a3b8]">Hạn:</span>
            <span className="text-[12px] font-semibold text-[#0f172a]">
              {due}
            </span>
          </span>
        </div>
      </div>

      <span
        className={`hidden shrink-0 items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold sm:inline-flex ${
          done ? "bg-[#10b981]/14 text-[#059669]" : "bg-white text-[#64748b]"
        }`}
      >
        {done ? (
          <BadgeCheck size={12} strokeWidth={2.6} />
        ) : (
          <CircleSlash size={12} strokeWidth={2.6} />
        )}
        {done ? "Hoàn thành" : "Chưa bắt đầu"}
      </span>
    </li>
  );
}

/* ── Một dòng KPI: Trước → Sau ──────────────────────────────────── */
function KpiRow({ row, isLast }) {
  const delta = row.after - row.before;
  const pct = (delta / row.before) * 100;
  const digits = Math.abs(row.before) >= 1000 ? 0 : 3;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-x border-b border-slate-200/80 bg-white/70 px-4 py-[12px] sm:flex-nowrap ${
        isLast ? "rounded-b-2xl" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 basis-full flex-col sm:basis-auto">
        <span className="text-[13px] font-semibold text-[#0f172a]">
          {row.label}
        </span>
        <span className="text-[11px] text-[#94a3b8]">{row.unit}</span>
      </div>

      <span className="text-right text-[13px] font-semibold tabular-nums text-[#94a3b8] sm:w-[110px] sm:shrink-0">
        {fmt(row.before, digits)}
      </span>

      <span className="text-right text-[13px] font-bold tabular-nums text-[#0f172a] sm:w-[110px] sm:shrink-0">
        {fmt(row.after, digits)}
      </span>

      <span className="flex sm:w-[150px] sm:shrink-0 sm:justify-end">
        <span className="inline-flex items-center gap-[5px] rounded-full bg-[#10b981]/12 px-[10px] py-[4px] text-[11px] font-bold tabular-nums text-[#059669]">
          <TrendingDown size={12} strokeWidth={3} />
          {fmt(delta, digits)} ({fmt(pct, 1)}%)
        </span>
      </span>
    </div>
  );
}

/* ── Hộp thoại ──────────────────────────────────────────────────── */
export default function ActionPlanModal({ item, onClose }) {
  if (!item) return null;

  const isLed = item.kind === "led";
  const steps = isLed ? ACTION_PLAN_STEPS.led : ACTION_PLAN_STEPS.generic;
  const kpiRows = isLed ? KPI_ROWS_LED : [];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0f172a]/35 p-3 backdrop-blur-[6px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dash-action-plan-title"
      onClick={onClose}
    >
      <div
        className={`${GLASS.modal} my-auto flex w-full max-w-[860px] flex-col gap-5 p-4 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Đầu hộp thoại */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-[6px] rounded-full bg-[#10b981]/14 px-[10px] py-[4px] text-[11px] font-bold text-[#059669]">
                <ClipboardList size={12} strokeWidth={2.6} />
                Action Plan · Ưu tiên {String(item.no).padStart(2, "0")}
              </span>
              <DataProvenanceTag compact />
            </div>
            <h2
              id="dash-action-plan-title"
              className="text-[16px] font-extrabold leading-snug text-[#0f172a] sm:text-[18px]"
            >
              {item.title}
            </h2>
            <p className="text-[12px] leading-snug text-[#64748b]">
              {item.level} · Tiết kiệm{" "}
              <b className="text-[#0f172a]">{item.saving}</b> · Hoàn vốn{" "}
              <b className="text-[#0f172a]">{item.payback}</b>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng Action Plan"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#64748b] transition-all hover:bg-white hover:text-[#0f172a] ${FOCUS}`}
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
          <h3 className="text-[13px] font-bold text-[#0f172a]">
            Quy trình triển khai 5 bước
          </h3>
          <ul className="flex flex-col gap-2">
            {steps.map((step) => (
              <StepItem key={step.no} step={step} />
            ))}
          </ul>
        </div>

        {/* Bảng so sánh KPI (chỉ với kịch bản đã có số liệu) */}
        {kpiRows.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-bold text-[#0f172a]">
              Bảng so sánh KPI: Trước → Sau
            </h3>

            {/* Header chỉ hiện từ sm; mobile đọc trực tiếp trên từng dòng */}
            <div className="hidden items-center gap-3 rounded-t-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-[10px] text-[12px] font-semibold text-[#64748b] sm:flex">
              <span className="min-w-0 flex-1">Chỉ số KPI</span>
              <span className="w-[110px] shrink-0 text-right">Trước</span>
              <span className="w-[110px] shrink-0 text-right">Sau</span>
              <span className="w-[150px] shrink-0 text-right">Chênh lệch</span>
            </div>

            <div className="-mt-3 sm:mt-0">
              {kpiRows.map((row, idx) => (
                <KpiRow
                  key={row.label}
                  row={row}
                  isLast={idx === kpiRows.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Chân hộp thoại */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <span className="text-[11px] leading-[1.5] text-[#94a3b8] sm:max-w-[520px]">
            {PROVENANCE_TEXT} · Quy trình và số liệu KPI dùng để lập kế hoạch
            nội bộ.
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-[#10b981] px-4 text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] sm:w-auto ${FOCUS}`}
          >
            <Check size={15} strokeWidth={2.8} />
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
