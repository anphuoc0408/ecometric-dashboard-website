/**
 * Sidebar – Điều hướng desktop.
 *
 * Chỉ hiển thị từ `lg` trở lên (`hidden lg:flex`).
 * Dưới `lg`, điều hướng do `BottomNav` đảm nhiệm.
 */
import { Leaf } from "lucide-react";
import { COLOR, FOCUS } from "../lib/format.js";
import { NAV_ITEMS } from "../data/dashboardData.js";

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-[260px] shrink-0 flex-col justify-between self-start border-r border-[#e2e8f0] bg-white p-5 lg:flex">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          // Sidebar rộng rãi nên luôn dùng nhãn đầy đủ.
          const text = label;
          const cls = isActive
            ? "bg-[#10b981]/10 font-semibold text-[#059669]"
            : "bg-transparent font-medium text-[#64748b] hover:bg-[#f8fafc]";

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[14px] transition-all active:scale-[0.98] ${FOCUS} ${cls}`}
            >
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              <span className="flex-1">{text}</span>
              {isActive && (
                <span className="h-4 w-1 rounded-[2px] bg-[#10b981]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#10b981]/10 p-4 text-center">
        <Leaf size={32} strokeWidth={2} color={COLOR.emerald} />
        <p className="text-[13px] font-semibold text-[#059669]">
          Hành Động Vì Trái Đất
        </p>
        <p className="text-[11px] leading-snug text-[#64748b]">
          Từng bước nhỏ tối ưu phát thải định hình tương lai vững bền.
        </p>
      </div>
    </aside>
  );
}
