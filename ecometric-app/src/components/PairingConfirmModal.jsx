/**
 * EcoMetric – Màn hình / Modal xác nhận ghép nối thiết bị qua mã QR
 *
 * Hiển thị khi người dùng mở ứng dụng với query param `?pair_session=...`
 * (thường là do quét mã QR từ camera điện thoại thông thường).
 *
 * Stack: React + Tailwind CSS v4 + lucide-react
 */
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Leaf,
  Link2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

export default function PairingConfirmModal({ pairSession, onDismiss }) {
  // Trạng thái: "pending" (chờ người dùng bấm xác nhận) | "confirmed" (đã kết nối thành công)
  const [status, setStatus] = useState("pending");
  const [confirmedAt, setConfirmedAt] = useState(null);

  const isConfirmed = status === "confirmed";

  // Thời điểm nhận yêu cầu
  const requestTime = useMemo(() => {
    return new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  const handleConfirm = () => {
    setStatus("confirmed");
    setConfirmedAt(
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-200 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pair-confirm-title"
    >
      <div className="relative flex w-full max-w-[420px] flex-col gap-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xl transition-all sm:p-6">
        {/* Header thương hiệu EcoMetric */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Leaf size={18} strokeWidth={2.4} />
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold tracking-tight text-slate-900">
                EcoMetric
              </span>
              <span className="text-[10.5px] font-medium text-slate-400">
                Web Dashboard
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              isConfirmed
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConfirmed ? "bg-emerald-500" : "animate-pulse bg-amber-500"
              }`}
            />
            {isConfirmed ? "Đã liên kết" : "Chờ xác nhận"}
          </span>
        </div>

        {/* Nội dung chính theo trạng thái */}
        {!isConfirmed ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center text-center">
              <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-xs">
                <Smartphone size={24} strokeWidth={2.2} />
              </span>
              <h2
                id="pair-confirm-title"
                className="text-[17px] font-bold text-slate-900"
              >
                Xác nhận ghép nối thiết bị
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
                Thiết bị di động này đang yêu cầu liên kết với phiên làm việc
                trên bảng điều khiển EcoMetric Web Dashboard.
              </p>
            </div>

            {/* Thẻ chi tiết phiên ghép nối */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-[12px]">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Link2 size={13} strokeWidth={2.2} className="text-slate-400" />
                  Mã phiên (Pair Session ID)
                </span>
                <code className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700">
                  {pairSession}
                </code>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={13} strokeWidth={2.2} className="text-slate-400" />
                  Thời điểm quét
                </span>
                <span className="font-medium text-slate-800">{requestTime}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <ShieldCheck size={13} strokeWidth={2.2} className="text-slate-400" />
                  Phạm vi kết nối
                </span>
                <span className="font-medium text-slate-800">
                  Đồng bộ dữ liệu vận hành & phát thải
                </span>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirm}
                className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-[0.98] ${FOCUS}`}
              >
                <Check size={16} strokeWidth={2.6} />
                Xác nhận ghép nối
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] ${FOCUS}`}
              >
                <ArrowLeft size={15} strokeWidth={2.2} />
                Quay lại Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-center">
            <div className="flex flex-col items-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-xs">
                <CheckCircle2 size={32} strokeWidth={2.2} />
              </span>
              <h2
                id="pair-confirm-title"
                className="text-[17px] font-bold text-slate-900"
              >
                Ghép nối thành công!
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
                Thiết bị di động của bạn đã được liên kết với phiên làm việc{" "}
                <strong className="font-semibold text-slate-800">
                  {pairSession}
                </strong>
                . Bạn có thể theo dõi và đồng bộ dữ liệu phát thải ngay bây giờ.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-[12px] text-emerald-800">
              <div className="flex items-center justify-between">
                <span>Trạng thái kết nối</span>
                <span className="font-semibold text-emerald-900">
                  Đã kích hoạt trực tuyến
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span>Thời điểm xác thực</span>
                <span>{confirmedAt}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-[0.98] ${FOCUS}`}
            >
              <ArrowLeft size={15} strokeWidth={2.4} />
              Quay lại Dashboard
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
