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
      className={`fixed left-0 top-[73px] z-20 hidden h-[calc(100vh-73px)] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-2 py-3 backdrop-blur-md transition-[width] duration-300 ease-in-out lg:flex ${
        isExpanded
          ? "w-64 shadow-[8px_0_24px_-16px_rgba(15,23,42,0.2)]"
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
        className={`absolute -right-2.5 top-3.5 z-30 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-95 ${FOCUS}`}
      >
        {isExpanded ? (
          <ChevronLeft size={13} strokeWidth={2.4} />
        ) : (
          <ChevronRight size={13} strokeWidth={2.4} />
        )}
      </button>

      {/* ── Icon thương hiệu EcoMetric đồng bộ với Topbar ─────────────── */}
      <div className="flex h-10 shrink-0 items-center gap-2.5 overflow-hidden px-1.5 py-1">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
          <Leaf size={17} strokeWidth={2.2} />
        </div>
        <div
          className={`flex min-w-0 flex-col whitespace-nowrap transition-opacity duration-200 ${
            isExpanded ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <span className="text-[13px] font-bold tracking-tight text-slate-900">
            EcoMetric
          </span>
          <span className="text-[10px] text-slate-400">
            Cơ sở sản xuất
          </span>
        </div>
      </div>

      {/* ── Danh sách mục điều hướng ──────────────────────────────── */}
      <nav
        id="sidebar-nav"
        className="mt-3 flex w-full flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-1"
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
                className={`relative flex h-10 w-full items-center gap-3 overflow-hidden rounded-lg px-2.5 transition-colors ${FOCUS} ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium"
                }`}
              >
                {/* Thanh chỉ báo emerald ở mép trái */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-emerald-600 transition-all duration-200 ${
                    isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                  }`}
                />

                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  className="shrink-0 transition-transform duration-150 group-hover/item:scale-105"
                />

                {/* Nhãn đầy đủ – chỉ hiện khi Sidebar mở rộng */}
                <span
                  className={`min-w-0 flex-1 truncate whitespace-nowrap text-left text-[13px] transition-opacity duration-200 ${
                    isExpanded ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  {label}
                </span>

                {/* Huy hiệu đếm */}
                {badge ? (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-[1px] text-[10px] font-semibold leading-4 transition-opacity duration-200 ${
                      isExpanded ? "opacity-100" : "pointer-events-none opacity-0"
                    } ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
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
                  className="pointer-events-none absolute left-full top-1/2 z-30 ml-2.5 -translate-y-1/2 translate-x-[-4px] whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-all duration-150 group-hover/item:translate-x-0 group-hover/item:opacity-100"
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
