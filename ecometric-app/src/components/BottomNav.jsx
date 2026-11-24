/**
 * BottomNav – Sticky Bottom Navigation Bar cho di động.
 *
 * Đặc điểm theo chuẩn iOS / Android:
 *  · Chỉ hiển thị dưới `lg` (khi Sidebar đã bị ẩn) → `lg:hidden`.
 *  · Cố định đáy màn hình (`fixed bottom-0`), có `backdrop-blur` kiểu glass.
 *  · Tự chừa khoảng an toàn cho iPhone có "home indicator":
 *    dùng `pb-[env(safe-area-inset-bottom)]`.
 *  · Đủ 6 mục (Tổng quan · Vận hành · Carbon · AI · ESG · Cài đặt) vẫn nằm
 *    gọn trên màn hình 390px: nhãn `text-[10px]` + `px-1` + `truncate`,
 *    icon thu nhỏ còn 18px ở màn hình hẹp (`max-[400px]`).
 *  · Mục đang chọn: đổi màu + icon nhấc nhẹ lên (`-translate-y-[1px]`).
 *
 * Lưu ý: `lg:hidden` phải là class CUỐI trong danh sách để thắng các
 * utility `flex` khi cùng mức đặc trưng (specificity).
 */
import { FOCUS } from "../lib/format.js";

export default function BottomNav({ items, active, onChange }) {
  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-xs backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex w-full max-w-[560px] items-stretch justify-around px-1">
        {items.map(({ id, label, navLabel, icon: Icon }) => {
          const isActive = id === active;
          const text = navLabel ?? label;

          return (
            <li key={id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                title={label}
                className={`relative flex h-[54px] w-full flex-col items-center justify-center gap-1 overflow-hidden px-1 transition-colors ${FOCUS} ${
                  isActive
                    ? "text-emerald-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {/* Vạch chỉ báo mục đang chọn */}
                <span
                  className={`absolute top-0 h-[2px] w-6 rounded-full bg-emerald-600 transition-opacity duration-150 sm:w-8 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />

                <span
                  className={`flex h-6 w-9 items-center justify-center rounded-md transition-colors ${
                    isActive ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.4 : 1.9}
                    className="shrink-0 sm:hidden"
                  />
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.4 : 1.9}
                    className="hidden shrink-0 sm:block"
                  />
                </span>

                <span
                  className={`w-full truncate px-1 text-center text-[10px] leading-tight ${
                    isActive ? "font-semibold" : "font-normal"
                  }`}
                >
                  {text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
