/**
 * Topbar – Thanh trên cùng.
 *
 * Responsive: trên mobile thu gọn – ẩn ô tìm kiếm (chuyển vào trang riêng),
 * ẩn tên/role người dùng để nhường chỗ cho logo + QR + thông báo.
 */
import { Bell, Leaf, Search } from "lucide-react";
import { FOCUS } from "../lib/format.js";
import { AVATAR_FALLBACK, AVATAR_URL } from "../data/dashboardData.js";
import QRCodeButton from "../QRCodeCard.jsx";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-[73px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Logo */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
          <Leaf size={18} strokeWidth={2.2} />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[17px] font-bold tracking-tight text-slate-900 sm:text-[18px]">
            EcoMetric
          </span>
          <span className="hidden text-[10px] font-medium text-slate-400 sm:inline-block">
            Quản trị Vận hành &amp; Phát thải
          </span>
        </div>
      </div>

      {/* Tìm kiếm – chỉ hiện từ md trở lên */}
      <label className="hidden w-[380px] items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 transition-colors focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500/20 md:flex">
        <Search
          size={15}
          strokeWidth={2}
          className="shrink-0 text-slate-400"
        />
        <input
          type="search"
          placeholder="Tìm kiếm dữ liệu, báo cáo, cơ sở..."
          className="h-5 min-w-0 flex-1 bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-400 lg:inline-block">
          ⌘K
        </kbd>
      </label>

      {/* Thông báo + QR + tài khoản */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <QRCodeButton />

        <button
          type="button"
          aria-label="Thông báo"
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 ${FOCUS}`}
        >
          <Bell size={18} strokeWidth={2} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5 pl-1 sm:border-l sm:border-slate-200 sm:pl-3">
          <img
            src={AVATAR_URL}
            alt="Ảnh đại diện của Nguyễn Văn A"
            width={34}
            height={34}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Nếu ảnh ngoài không tải được, chuyển sang SVG dự phòng (không vỡ ảnh).
              if (e.currentTarget.src !== AVATAR_FALLBACK) {
                e.currentTarget.src = AVATAR_FALLBACK;
              }
            }}
            className="h-8.5 w-8.5 shrink-0 rounded-full border border-slate-200 bg-emerald-50 object-cover"
          />
          {/* Tên + chức danh chỉ hiện từ md trở lên */}
          <div className="hidden flex-col whitespace-nowrap leading-tight md:flex">
            <span className="text-[13px] font-semibold text-slate-900">
              Nguyễn Văn A
            </span>
            <span className="text-[11px] text-slate-500">Quản trị viên</span>
          </div>
        </div>
      </div>
    </header>
  );
}
