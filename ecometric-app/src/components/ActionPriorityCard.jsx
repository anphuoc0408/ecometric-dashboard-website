/**
 * ActionPriorityCard – Khối "Top 3 việc cần làm ngay trong tháng"
 *
 * Responsive:
 *  · Mobile (< 1280px): danh sách thẻ DỌC (vertical stack) – mỗi thẻ full width.
 *  · ≥ 1280px (xl)    : 3 cột ngang.
 *
 * 3 thẻ trắng đồng nhất viền mảnh, làm nổi bật 3 thông số chính:
 * Tiết kiệm chi phí, Giảm CO2e và Thời gian hoàn vốn.
 */
import {
  ClipboardList,
  Cpu,
  Leaf,
  RefreshCw,
  Wallet,
  Zap,
} from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY } from "../lib/format.js";
import DataProvenanceTag from "./DataProvenanceTag.jsx";

/* ── Một thẻ ưu tiên ────────────────────────────────────────────── */
export function ActionPriorityCard({ item, onOpenPlan, onGoToAI }) {
  const isLed = item.kind === "led";

  return (
    <article
      className="group relative flex flex-col gap-3.5 rounded-xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition-all duration-150 hover:border-slate-300 hover:shadow-sm sm:p-5 xl:h-full"
      aria-label={`Ưu tiên ${item.no}: ${item.title}`}
    >
      {/* Hàng đầu: Tag ưu tiên + Cơ sở + Thời hạn */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
              item.no === 1
                ? "border border-emerald-200/70 bg-emerald-50 text-emerald-700"
                : "border border-slate-200 bg-slate-100 text-slate-700"
            }`}
          >
            Ưu tiên {String(item.no).padStart(2, "0")}
          </span>
          <span className="inline-flex items-center rounded-md border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {item.site}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {item.level?.includes("·")
            ? item.level.split("·")[1].trim()
            : item.level}
        </span>
      </div>

      {/* Tên giải pháp */}
      <h3 className="min-h-[42px] text-[14px] font-semibold leading-snug text-slate-900 line-clamp-2 sm:text-[15px]">
        {item.title}
      </h3>

      {/* 3 thông số chính: Tiết kiệm chi phí, Giảm CO2e và Thời gian hoàn vốn */}
      <div className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
        {/* Tiết kiệm chi phí */}
        <div className="flex flex-col gap-1 pb-2 sm:flex-row sm:items-baseline sm:justify-between">
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Wallet size={14} className="shrink-0 text-slate-400" />
            Tiết kiệm chi phí
          </span>
          <div className="text-left sm:text-right">
            <span className="text-[12.5px] font-bold text-slate-900 tabular-nums sm:text-[13px]">
              {item.saving.includes("(") ? item.saving.split("(")[0].trim() : item.saving}
            </span>
            {item.saving.includes("(") && (
              <span className="block text-[10.5px] font-normal text-slate-500 tabular-nums whitespace-nowrap sm:ml-1 sm:inline">
                ({item.saving.split("(")[1]}
              </span>
            )}
          </div>
        </div>

        {/* Giảm CO2e */}
        <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:justify-between">
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Leaf size={14} className="shrink-0 text-emerald-600" />
            Giảm CO2e
          </span>
          <div className="text-left sm:text-right">
            <span className="text-[12.5px] font-bold text-emerald-700 tabular-nums sm:text-[13px]">
              {item.reduction.includes("(") ? item.reduction.split("(")[0].trim() : item.reduction}
            </span>
            {item.reduction.includes("(") && (
              <span className="block text-[10.5px] font-normal text-emerald-600/80 tabular-nums whitespace-nowrap sm:ml-1 sm:inline">
                ({item.reduction.split("(")[1]}
              </span>
            )}
          </div>
        </div>

        {/* Thời gian hoàn vốn */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <RefreshCw size={14} className="shrink-0 text-slate-400" />
            Thời gian hoàn vốn
          </span>
          <span className="text-right text-[12.5px] font-bold text-slate-900 tabular-nums sm:text-[13px]">
            {item.payback}
          </span>
        </div>
      </div>

      {/* Ghi chú chi tiết */}
      <p className="min-h-[32px] text-[11px] leading-relaxed text-slate-500 line-clamp-2">
        {item.note}
      </p>

      {/* Nút hành động */}
      <div className="mt-auto border-t border-slate-100 pt-3">
        {isLed ? (
          <button
            type="button"
            onClick={() => onOpenPlan(item)}
            className={BTN_PRIMARY}
          >
            <ClipboardList size={15} strokeWidth={2.4} />
            Tạo Action Plan
          </button>
        ) : (
          <button type="button" onClick={onGoToAI} className={BTN_GHOST}>
            <Cpu size={15} strokeWidth={2.2} />
            Xem trong Khuyến nghị AI
          </button>
        )}
      </div>
    </article>
  );
}

/* ── Khối bao quanh: tiêu đề + danh sách thẻ ────────────────────── */
export default function ActionPriorityCardList({
  items,
  onOpenPlan,
  onGoToAI,
}) {
  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-white p-4.5 shadow-xs sm:p-5"
      aria-labelledby="actionable-priorities-title"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
            <Zap size={16} strokeWidth={2.4} />
          </span>
          <div className="flex flex-col">
            <h2
              id="actionable-priorities-title"
              className="text-[15px] font-bold text-slate-900 sm:text-[16px]"
            >
              Top 3 việc cần làm ngay trong tháng
            </h2>
            <p className="text-[12px] text-slate-500">
              Xếp hạng theo tác động phát thải, tiết kiệm chi phí và thời gian hoàn vốn
            </p>
          </div>
        </div>
        <DataProvenanceTag compact />
      </div>

      {/* Danh sách 3 thẻ trắng đồng nhất viền mảnh */}
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-3 xl:items-stretch">
        {items.map((item) => (
          <ActionPriorityCard
            key={item.no}
            item={item}
            onOpenPlan={onOpenPlan}
            onGoToAI={onGoToAI}
          />
        ))}
      </div>
    </section>
  );
}
