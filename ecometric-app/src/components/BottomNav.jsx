/**
 * BottomNav – Sticky Bottom Navigation Bar cho di động.
 *
 * Đặc điểm theo chuẩn iOS / Android:
 *  · Chỉ hiển thị dưới `lg` (khi Sidebar đã bị ẩn) → `lg:hidden`.
 *  · Cố định đáy màn hình (`fixed bottom-0`), có `backdrop-blur` kiểu glass.
 *  · Tự chừa khoảng an toàn cho iPhone có "home indicator":
 *    dùng `pb-[env(safe-area-inset-bottom)]`.
 *  · Mỗi mục tối thiểu 44×44px, có nhãn chữ bên dưới icon.
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_-12px_rgba(15,23,42,0.28)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 lg:hidden"
    >
      <ul className="mx-auto flex w-full max-w-[560px] items-stretch justify-around px-1">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;

          return (
            <li key={id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className={`relative flex h-[58px] w-full flex-col items-center justify-center gap-[3px] rounded-2xl px-1 transition-all duration-200 active:scale-[0.94] ${FOCUS} ${
                  isActive
                    ? "text-[#059669]"
                    : "text-[#94a3b8] hover:text-[#64748b]"
                }`}
              >
                {/* Vạch chỉ báo mục đang chọn */}
                <span
                  className={`absolute top-0 h-[3px] w-8 rounded-full bg-[#10b981] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />

                <span
                  className={`flex h-7 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? "-translate-y-[1px] bg-[#10b981]/12"
                      : "bg-transparent"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </span>

                <span
                  className={`w-full truncate px-[2px] text-[10px] leading-none ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
