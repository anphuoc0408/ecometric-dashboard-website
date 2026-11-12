/**
 * Sidebar – Thanh điều hướng dọc THU GỌN, mở rộng bằng NÚT BẤM (Click-to-Toggle).
 *
 * Đặc điểm:
 *  · Chỉ hiển thị từ `lg` trở lên (`hidden lg:flex`); dưới `lg` điều hướng do
 *    `BottomNav` đảm nhiệm.
 *  · Trạng thái thu gọn (mặc định, `isExpanded = false`): `w-20` (80px) – chỉ
 *    icon ở giữa, logo tròn gọn. Nhãn chữ ẩn, hover từng mục hiện Tooltip.
 *  · Trạng thái mở rộng: bấm nút tròn ở mép phải trên cùng → trượt ra `w-64`
 *    (256px), hiện đầy đủ tên tab + huy hiệu đếm. Chuyển động
 *    `transition-[width] duration-300 ease-in-out`.
 *  · Mục đang chọn: nền emerald nhạt + bóng sáng, bo góc mềm, thanh chỉ báo
 *    emerald ở mép trái.
 *  · Sidebar là `fixed` với chiều cao đúng `calc(100vh - 73px)` nên luôn neo
 *    trong viewport, không kéo dài theo nội dung trang và không đẩy layout
 *    chính (nội dung chỉ chừa `lg:pl-20`).
 *
 * Lưu ý: vì Sidebar là `fixed`, App.jsx phải chừa khoảng trống tương ứng
 * (`lg:pl-20`) cho vùng nội dung.
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { FOCUS } from "../lib/format.js";
import { NAV_ITEMS } from "../data/dashboardData.js";

// Huy hiệu đếm tuỳ chọn cho từng tab (không có → không hiện).
const BADGES = {
  ai: 3,
  esg: 1,
};

export default function Sidebar({ active, onChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      aria-label="Điều hướng chính"
      className={`fixed left-0 top-[73px] z-20 hidden h-[calc(100vh-73px)] shrink-0 flex-col border-r border-[#e2e8f0] bg-white/95 px-2 py-3 backdrop-blur-xl transition-[width] duration-300 ease-in-out lg:flex ${
        isExpanded
          ? "w-64 shadow-[12px_0_32px_-24px_rgba(15,23,42,0.45)]"
          : "w-20"
      }`}
    >
      {/* ── Nút toggle tròn ở mép phải trên cùng ──────────────────── */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-controls="sidebar-nav"
        aria-label={isExpanded ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
        title={isExpanded ? "Thu gọn" : "Mở rộng"}
        className={`absolute -right-3 top-4 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.25)] transition-all duration-200 hover:border-[#10b981]/40 hover:bg-[#10b981]/10 hover:text-[#059669] active:scale-90 ${FOCUS}`}
      >
        {isExpanded ? (
          <ChevronLeft size={14} strokeWidth={2.6} />
        ) : (
          <ChevronRight size={14} strokeWidth={2.6} />
        )}
      </button>

      {/* ── Logo: tròn gọn khi thu, đầy đủ khi mở rộng ─────────────── */}
      <div className="flex h-12 shrink-0 items-center gap-3 overflow-hidden px-1">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] shadow-[0_6px_16px_-6px_rgba(16,185,129,0.8)] ring-4 ring-[#10b981]/10">
          <Leaf size={20} strokeWidth={2.4} color="#ffffff" />
        </div>
        <div
          className={`flex min-w-0 flex-col whitespace-nowrap transition-opacity duration-200 ${
            isExpanded ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <span className="text-[15px] font-extrabold leading-tight text-[#0f172a]">
            EcoMetric
          </span>
          <span className="text-[10px] font-medium text-[#94a3b8]">
            Bền vững &amp; Tối ưu
          </span>
        </div>
      </div>

      {/* ── Danh sách mục điều hướng ──────────────────────────────── */}
      <nav
        id="sidebar-nav"
        className="mt-4 flex w-full flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-1"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          const badge = BADGES[id];

          return (
            <div key={id} className="group/item relative w-full">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className={`relative flex h-11 w-full items-center gap-3 overflow-hidden rounded-xl px-3 transition-all duration-200 ease-out active:scale-[0.98] ${FOCUS} ${
                  isActive
                    ? "bg-[#10b981]/12 text-[#059669] shadow-[0_6px_18px_-10px_rgba(16,185,129,0.9)]"
                    : "text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569]"
                }`}
              >
                {/* Thanh chỉ báo emerald ở mép trái */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#10b981] transition-all duration-200 ${
                    isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                  }`}
                />

                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 2}
                  className="shrink-0 transition-transform duration-200 group-hover/item:scale-110"
                />

                {/* Nhãn đầy đủ – chỉ hiện khi Sidebar mở rộng */}
                <span
                  className={`min-w-0 flex-1 truncate whitespace-nowrap text-left text-[13.5px] transition-opacity duration-200 ${
                    isExpanded ? "opacity-100" : "pointer-events-none opacity-0"
                  } ${isActive ? "font-semibold" : "font-medium"}`}
                >
                  {label}
                </span>

                {/* Huy hiệu đếm */}
                {badge ? (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-[1px] text-[10px] font-bold leading-4 transition-opacity duration-200 ${
                      isExpanded ? "opacity-100" : "pointer-events-none opacity-0"
                    } ${
                      isActive
                        ? "bg-[#10b981] text-white"
                        : "bg-[#e2e8f0] text-[#475569]"
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>

              {/* Tooltip – chỉ hiện khi Sidebar còn THU GỌN */}
              {!isExpanded && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 -translate-y-1/2 translate-x-[-4px] whitespace-nowrap rounded-lg bg-[#0f172a] px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-all duration-150 group-hover/item:translate-x-0 group-hover/item:opacity-100"
                >
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
