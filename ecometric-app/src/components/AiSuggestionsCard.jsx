/**
 * AiSuggestionsCard – Khuyến nghị đề xuất từ AI.
 *
 * Props: `suggestions` – mảng khuyến nghị (mặc định lấy từ dashboardData.js
 * để tương thích ngược với call-site cũ <AiSuggestionsCard />).
 *
 * Responsive: 1 cột trên mobile, 2 cột từ sm trở lên.
 */
import { Cpu } from "lucide-react";
import { CARD, COLOR } from "../lib/format.js";
import { SUGGESTIONS } from "../data/dashboardData.js";

export default function AiSuggestionsCard({ suggestions = SUGGESTIONS }) {
  return (
    <section
      className={`${CARD} flex flex-col gap-4 p-4 sm:p-5`}
      aria-labelledby="ai-suggestions-title"
    >
      <div className="flex items-center gap-2">
        <Cpu
          size={20}
          strokeWidth={2}
          color={COLOR.emeraldDark}
          className="shrink-0"
        />
        <h2
          id="ai-suggestions-title"
          className="text-[15px] font-bold text-[#0f172a]"
        >
          Khuyến nghị đề xuất từ AI
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map(({ icon: Icon, title, desc }) => (
          <article
            key={title}
            className="flex flex-col gap-2 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_2px_2px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-[1px] hover:shadow-[0_10px_22px_-14px_rgba(15,23,42,0.28)]"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#10b981]/10">
                <Icon size={16} strokeWidth={2} color={COLOR.emeraldDark} />
              </div>
              <h3 className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-[#0f172a]">
                {title}
              </h3>
            </div>
            <p className="text-[12px] leading-snug text-[#64748b]">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
