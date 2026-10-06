/**
 * ActionPriorityCard – Khối "Top 3 việc cần làm ngay trong tháng"
 *
 * Responsive:
 *  · Mobile (< 1280px): danh sách thẻ DỌC (vertical stack) – mỗi thẻ full width,
 *    đọc từ trên xuống, nút Primary Action luôn nằm cuối thẻ và full-width.
 *  · ≥ 1280px (xl)    : 3 cột ngang như thiết kế Figma.
 *
 * Mỗi thẻ hiển thị: số ưu tiên, tiêu đề, mức tiết kiệm chi phí,
 * giảm phát thải, thời gian hoàn vốn + 1 nút Primary Action.
 */
import { ClipboardList, Cpu, Leaf, RefreshCw, Wallet, Zap } from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY, COLOR, GLASS } from "../lib/format.js";
import DataProvenanceTag from "./DataProvenanceTag.jsx";

/* ── Một thẻ ưu tiên ────────────────────────────────────────────── */
export function ActionPriorityCard({ item, onOpenPlan, onGoToAI }) {
  const Icon = item.icon;
  const isLed = item.kind === "led";

  return (
    <article
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_2px_10px_-6px_rgba(15,23,42,0.15)] transition-all duration-200 active:scale-[0.995] hover:border-slate-300 hover:shadow-[0_14px_30px_-16px_rgba(15,23,42,0.35)] sm:p-5 xl:h-full"
      aria-label={`Ưu tiên ${item.no}: ${item.title}`}
    >
      {/* Vệt màu nhận diện mức ưu tiên */}
      <span
        className="absolute bottom-0 left-0 top-0 w-1"
        style={{ backgroundColor: item.color }}
      />

      {/* Hàng đầu: biểu tượng + số ưu tiên + mức độ */}
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${item.color}1f` }}
        >
          <Icon size={19} strokeWidth={2.2} color={item.color} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: `${item.color}1f`, color: item.color }}
            >
              Ưu tiên {String(item.no).padStart(2, "0")}
            </span>
            <span className="inline-flex items-center rounded-full bg-[#f1f5f9] px-[9px] py-[3px] text-[10px] font-semibold text-[#64748b]">
              {item.site}
            </span>
          </div>
          <span className="text-[11px] leading-snug text-[#94a3b8]">
            {item.level}
          </span>
        </div>
      </div>

      {/* Tên giải pháp */}
      <h3 className="text-[14px] font-bold leading-[1.45] text-[#0f172a] sm:text-[15px]">
        {item.title}
      </h3>

      {/* 3 thông số chính: tiết kiệm · giảm phát thải · hoàn vốn */}
      <ul className="flex flex-col gap-2.5 rounded-2xl bg-[#f8fafc] px-3 py-3">
        <li className="flex items-start gap-2.5">
          <Wallet
            size={15}
            strokeWidth={2.6}
            color={COLOR.blue}
            className="mt-[2px] shrink-0"
          />
          <span className="flex min-w-0 flex-col gap-[1px]">
            <span className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
              Tiết kiệm chi phí
            </span>
            <span className="text-[12px] font-bold leading-snug text-[#0f172a] sm:text-[13px]">
              {item.saving}
            </span>
          </span>
        </li>

        <li className="flex items-start gap-2.5">
          <Leaf
            size={15}
            strokeWidth={2.6}
            color={COLOR.emeraldDark}
            className="mt-[2px] shrink-0"
          />
          <span className="flex min-w-0 flex-col gap-[1px]">
            <span className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
              Giảm phát thải / lãng phí
            </span>
            <span className="text-[12px] font-bold leading-snug text-[#0f172a] sm:text-[13px]">
              {item.reduction}
            </span>
          </span>
        </li>

        <li className="flex items-start gap-2.5">
          <RefreshCw
            size={15}
            strokeWidth={2.6}
            color={COLOR.violet}
            className="mt-[2px] shrink-0"
          />
          <span className="flex min-w-0 flex-col gap-[1px]">
            <span className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
              Hoàn vốn
            </span>
            <span className="text-[12px] font-bold leading-snug text-[#0f172a] sm:text-[13px]">
              {item.payback}
            </span>
          </span>
        </li>
      </ul>

      {/* Ghi chú cơ sở tính */}
      <p className="text-[11px] leading-[1.55] text-[#94a3b8]">{item.note}</p>

      {/* Nút Primary Action – luôn ở đáy thẻ */}
      <div className="mt-auto border-t border-[#f1f5f9] pt-3">
        {isLed ? (
          <button
            type="button"
            onClick={() => onOpenPlan(item)}
            className={BTN_PRIMARY}
          >
            <ClipboardList size={16} strokeWidth={2.6} />
            Tạo Action Plan
          </button>
        ) : (
          <button type="button" onClick={onGoToAI} className={BTN_GHOST}>
            <Cpu size={16} strokeWidth={2.4} />
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
      className={`${GLASS.card} relative flex flex-col gap-4 overflow-hidden p-4 sm:p-5`}
      aria-labelledby="actionable-priorities-title"
    >
      {/* Vệt nhấn nhận diện khối hành động */}
      <span
        className="absolute bottom-0 left-0 top-0 w-1"
        style={{ backgroundColor: COLOR.emerald }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#10b981]/14">
            <Zap size={19} strokeWidth={2.2} color={COLOR.emeraldDark} />
          </span>
          <div className="flex flex-col gap-1">
            <h2
              id="actionable-priorities-title"
              className="text-[15px] font-bold text-[#0f172a] sm:text-[16px]"
            >
              Top 3 việc cần làm ngay trong tháng
            </h2>
            <p className="text-[12px] leading-snug text-[#64748b]">
              Actionable Priorities · xếp hạng theo tác động phát thải, chi phí
              và thời gian hoàn vốn
            </p>
          </div>
        </div>
        <DataProvenanceTag />
      </div>

      {/*
        Danh sách thẻ: DỌC trên mobile → 3 CỘT từ xl.
        `items-stretch` giúp 3 thẻ cao bằng nhau ở desktop.
      */}
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
