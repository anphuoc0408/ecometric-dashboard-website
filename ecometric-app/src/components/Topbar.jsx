/**
 * Topbar – Thanh trên cùng.
 *
 * Responsive: trên mobile thu gọn – ẩn ô tìm kiếm (chuyển vào trang riêng),
 * ẩn tên/role người dùng để nhường chỗ cho logo + QR + thông báo.
 */
import { Bell, Leaf, Search } from "lucide-react";
import { COLOR, FOCUS } from "../lib/format.js";
import { AVATAR_URL } from "../data/dashboardData.js";
import QRCodeButton from "../QRCodeCard.jsx";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
      {/* Logo */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10">
          <Leaf size={18} strokeWidth={2} color={COLOR.emeraldDark} />
        </div>
        <span className="truncate text-[18px] font-extrabold text-[#0f172a] sm:text-[20px]">
          EcoMetric
        </span>
      </div>

      {/* Tìm kiếm – chỉ hiện từ md trở lên */}
      <label className="hidden w-[400px] items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 md:flex">
        <Search
          size={16}
          strokeWidth={2}
          color={COLOR.muted}
          className="shrink-0"
        />
        <input
          type="search"
          placeholder="Tìm kiếm dữ liệu, báo cáo..."
          className="h-4 min-w-0 flex-1 bg-transparent text-[13px] text-[#0f172a] outline-none placeholder:text-[#64748b]"
        />
      </label>

      {/* Thông báo + QR + tài khoản */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <QRCodeButton />

        <button
          type="button"
          aria-label="Thông báo"
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] transition-colors hover:bg-white ${FOCUS}`}
        >
          <Bell size={20} strokeWidth={2} color={COLOR.slate} />
          <span className="absolute left-[23px] top-[7px] h-2 w-2 rounded-full bg-[#ef4444]" />
        </button>

        <div className="flex items-center gap-2">
          <img
            src={AVATAR_URL}
            alt="Ảnh đại diện"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
          {/* Tên + chức danh chỉ hiện từ md trở lên */}
          <div className="hidden flex-col gap-[2px] whitespace-nowrap md:flex">
            <span className="text-[13px] font-semibold text-[#0f172a]">
              Nguyễn Văn A
            </span>
            <span className="text-[11px] text-[#64748b]">Quản trị viên</span>
          </div>
        </div>
      </div>
    </header>
  );
}
