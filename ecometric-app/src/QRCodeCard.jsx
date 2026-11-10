/**
 * EcoMetric – Nút mã QR chia sẻ nhanh (dùng trong Header)
 * Stack: React + Tailwind CSS + lucide-react + qrcode.react
 *   npm i qrcode.react
 *
 * Cách dùng:
 *   import QRCodeButton from "./QRCodeCard.jsx";
 *   <QRCodeButton />                    // sinh Pair Session ID mới mỗi lần mở
 *   <QRCodeButton size={200} />         // tuỳ biến kích thước mã QR
 *
 * Xuất kèm `QRCodeModal` nếu chỉ muốn dùng phần hộp thoại.
 *
 * Cách căn giữa (quan trọng):
 *   Hộp thoại được render qua `createPortal` vào `document.body`.
 *   Lý do: nút QR nằm trong <header> của Topbar, mà header có
 *   `backdrop-filter: blur(24px)`. Theo spec CSS, phần tử có backdrop-filter
 *   sẽ trở thành CONTAINING BLOCK cho mọi `position: fixed` bên trong nó.
 *   Hệ quả: `fixed inset-0` bị neo vào thanh Topbar cao ~64px thay vì toàn
 *   màn hình → modal bị dồn lên mép trên. Portal đưa modal ra ngoài header
 *   nên `inset-0` luôn phủ đúng toàn viewport.
 *
 *   Khi đó việc căn giữa dùng lớp `min-h-full` + `flex items-center`
 *   (KHÔNG dùng `items-center` trực tiếp trên hộp cuộn, vì flex item cao
 *   hơn vùng cuộn sẽ bị cắt ở mép trên và không cuộn tới được).
 *
 * Lưu ý: `imageSettings` cần được cấu hình TRƯỚC khi QR render.
 * Vì logo tải bất đồng bộ, ta bật cờ `logoReady` sau khi ảnh load xong
 * để QRCodeSVG vẽ lại kèm logo ở giữa (excavate để không phá mã).
 *
 * Ghép nối thiết bị (Pairing):
 *   Mã QR chứa một `Pair Session ID` sinh động cho mỗi phiên ghép nối
 *   (định dạng `ecometric://pair?session=...`). Nút "Mô phỏng quét từ iOS App"
 *   giả lập luồng xác thực: đang xác thực → đã kết nối, kèm thời điểm đồng bộ
 *   gần nhất. Phiên hết hạn sau PAIR_SESSION_TTL_MS, khi đó QR được sinh lại.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Leaf,
  Link2,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  X,
} from "lucide-react";

// Thời lượng hiệu ứng đóng (ms) – phải khớp với class `duration-200` bên dưới.
const CLOSE_ANIMATION_MS = 200;

// Thời gian giả lập iOS App xác thực phiên ghép nối (ms).
const PAIR_AUTH_MS = 1200;

// Phiên ghép nối hết hạn sau 5 phút (ms).
const PAIR_SESSION_TTL_MS = 5 * 60 * 1000;

export const DEFAULT_URL = "https://ecometric-dashboard-website.vercel.app/";

// Sinh Pair Session ID ngẫu nhiên (không dùng crypto để chạy được cả HTTP).
function createPairSessionId() {
  const rand = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ECO-${rand()}-${rand()}`;
}

// Nội dung nhúng trong mã QR: deep link mở iOS App kèm session cần ghép nối.
function buildPairPayload(sessionId) {
  return `ecometric://pair?session=${encodeURIComponent(sessionId)}`;
}

// Định dạng thời điểm đồng bộ theo giờ Việt Nam (vi-VN).
function formatSyncTime(date) {
  if (!date) return "";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Logo mầm cây lồng giữa mã QR (SVG data-URI, nền trắng để tương phản).
const LEAF_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#ffffff"/>
  <path d="M70 24c2 22-12 38-30 38-3 0-6-.4-8-1 2-16 14-30 30-34 3-.7 5-1.6 8-3z" fill="#10b981"/>
  <path d="M26 74c2-12 10-22 20-28" fill="none" stroke="#059669" stroke-width="6" stroke-linecap="round"/>
</svg>`;
const LEAF_LOGO_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  LEAF_LOGO_SVG.trim(),
)}`;

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]";

/* ── Hộp thoại chứa mã QR ───────────────────────────────────── */
export function QRCodeModal({
  size = 200,
  title = "Quét mã để mở EcoMetric",
  onClose,
}) {
  const [logoReady, setLogoReady] = useState(false);
  const [copied, setCopied] = useState(false);
  // `closing` bật hiệu ứng fade-out + scale-down trước khi unmount hẳn.
  const [closing, setClosing] = useState(false);
  const canvasHostRef = useRef(null);
  const closeTimer = useRef(null);

  // ── Trạng thái ghép nối với iOS App ──────────────────────────
  // idle → authenticating → connected
  const [pairStatus, setPairStatus] = useState("idle");
  const [sessionId, setSessionId] = useState(() => createPairSessionId());
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const authTimer = useRef(null);

  // Mã QR động: mỗi phiên ghép nối tạo một payload riêng.
  const pairPayload = useMemo(() => buildPairPayload(sessionId), [sessionId]);
  const isConnected = pairStatus === "connected";
  const isAuthenticating = pairStatus === "authenticating";

  // Sinh lại phiên ghép nối mới (dùng khi hết hạn hoặc người dùng yêu cầu).
  const regenerateSession = useCallback(() => {
    window.clearTimeout(authTimer.current);
    setSessionId(createPairSessionId());
    setPairStatus("idle");
    setLastSyncAt(null);
  }, []);

  // Giả lập iOS App quét mã: xác thực một nhịp rồi chuyển sang đã kết nối.
  const simulateIosScan = () => {
    if (isAuthenticating) return;
    setPairStatus("authenticating");
    window.clearTimeout(authTimer.current);
    authTimer.current = window.setTimeout(() => {
      setPairStatus("connected");
      setLastSyncAt(new Date());
    }, PAIR_AUTH_MS);
  };

  // Phiên ghép nối tự hết hạn sau PAIR_SESSION_TTL_MS (chỉ khi chưa kết nối).
  useEffect(() => {
    if (isConnected) return undefined;
    const ttlTimer = window.setTimeout(() => {
      setSessionId(createPairSessionId());
      setPairStatus("idle");
    }, PAIR_SESSION_TTL_MS);
    return () => window.clearTimeout(ttlTimer);
  }, [sessionId, isConnected]);

  // Dọn timer xác thực khi unmount.
  useEffect(() => () => window.clearTimeout(authTimer.current), []);

  // Đóng có hiệu ứng: chạy animation rồi mới gọi onClose của component cha.
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => onClose?.(), CLOSE_ANIMATION_MS);
  };

  // Cấu hình logo chỉ khi ảnh đã sẵn sàng (tránh render logo rỗng).
  const imageSettings = useMemo(
    () => ({
      src: LEAF_LOGO_URI,
      height: 40,
      width: 40,
      excavate: true,
    }),
    [],
  );

  const effectiveImageSettings = logoReady ? imageSettings : undefined;

  // Đóng hộp thoại bằng phím Esc (kèm hiệu ứng đóng)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  // Dọn timer khi unmount để không gọi setState trên component đã gỡ
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Khoá cuộn trang nền khi hộp thoại đang mở
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pairPayload);
    } catch {
      // Fallback cho trình duyệt / ngữ cảnh không có Clipboard API
      const ta = document.createElement("textarea");
      ta.value = pairPayload;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* bỏ qua */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = canvasHostRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `ecometric-pair-${sessionId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 backdrop-blur-sm transition-all duration-200 ease-out sm:p-6 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-share-title"
      onClick={requestClose}
    >
      {/* Lớp căn giữa: `min-h-full` + `flex items-center` buộc thẻ nằm giữa
          chiều cao màn hình; khi thẻ cao hơn màn hình thì lớp này tự cao
          theo nội dung nên vẫn cuộn xem được trọn vẹn từ trên xuống. */}
      <div className="flex min-h-full items-center justify-center">
        <div
          className={`relative flex w-full max-w-[380px] flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out sm:p-6 ${
            closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Tiêu đề + nút đóng (neo góc trên bên phải, vùng chạm 40×40) */}
        <div className="flex items-start justify-between gap-3 pr-11">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#10b981]/10">
              <QrCode size={18} strokeWidth={2.2} color="#059669" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h2 id="qr-share-title" className="text-[15px] font-bold text-[#0f172a]">
                {isConnected ? "Đã kết nối thành công với EcoMetric iOS" : "Ghép nối EcoMetric iOS"}
              </h2>
              <p className="text-[12px] text-[#64748b]">
                {isConnected ? "Thiết bị đã sẵn sàng đồng bộ dữ liệu" : title}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={requestClose}
          aria-label="Đóng mã QR"
          className={`absolute right-3 top-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] shadow-sm transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a] active:scale-[0.94] sm:right-4 sm:top-4 ${FOCUS}`}
        >
          <X size={18} strokeWidth={2.4} />
        </button>

      {/* Mã QR động chứa Pair Session ID */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-[20px] border border-white/70 bg-white/70 p-4 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur-[12px]">
          {/* Bản SVG hiển thị rõ nét ở mọi kích thước */}
          <QRCodeSVG
            value={pairPayload}
            size={size}
            level="H"
            bgColor="#ffffff"
            fgColor="#0f172a"
            marginSize={1}
            title={`Mã QR ghép nối EcoMetric iOS – phiên ${sessionId}`}
            imageSettings={effectiveImageSettings}
            className="block h-auto max-w-full"
          />

          {/* Lớp phủ khi đang xác thực / đã kết nối */}
          {(isAuthenticating || isConnected) && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[20px] bg-white/90 px-4 text-center backdrop-blur-[2px]"
            >
              {isConnected ? (
                <>
                  <CheckCircle2 size={40} strokeWidth={2.2} color="#10b981" />
                  <p className="text-[13px] font-bold text-[#0f172a]">
                    Đã kết nối thành công với EcoMetric iOS
                  </p>
                  <p className="text-[12px] text-[#64748b]">
                    Đồng bộ gần nhất: {formatSyncTime(lastSyncAt)}
                  </p>
                </>
              ) : (
                <>
                  <Loader2 size={36} strokeWidth={2.2} color="#059669" className="animate-spin" />
                  <p className="text-[13px] font-semibold text-[#0f172a]">
                    Đang xác thực phiên ghép nối…
                  </p>
                </>
              )}
            </div>
          )}

          {/* Bản Canvas ẩn, chỉ dùng để xuất PNG đúng kích thước */}
          <div
            ref={canvasHostRef}
            className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0"
          >
            <QRCodeCanvas
              value={pairPayload}
              size={size * 2}
              level="H"
              bgColor="#ffffff"
              fgColor="#0f172a"
              marginSize={1}
              imageSettings={
                logoReady
                  ? { ...imageSettings, height: 76, width: 76 }
                  : undefined
              }
            />
          </div>
        </div>

        <p className="inline-flex min-w-0 max-w-full items-center gap-[6px] text-[12px] text-[#64748b]">
          <Link2 size={13} strokeWidth={2.4} className="shrink-0" />
          <span className="truncate">Pair Session ID: {sessionId}</span>
        </p>

        {isConnected && (
          <p className="inline-flex items-center gap-[6px] text-[12px] font-medium text-[#059669]">
            <CheckCircle2 size={13} strokeWidth={2.6} className="shrink-0" />
            Đồng bộ gần nhất: {formatSyncTime(lastSyncAt)}
          </p>
        )}
      </div>

      {/* Hành động */}
      <div className="flex flex-col gap-2 border-t border-[#e2e8f0] pt-4">
        <button
          type="button"
          onClick={simulateIosScan}
          disabled={isAuthenticating || isConnected}
          className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0f172a] px-4 py-[10px] text-[13px] font-semibold text-white transition-all hover:bg-[#1e293b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
        >
          {isAuthenticating ? (
            <Loader2 size={15} strokeWidth={2.6} className="animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 size={15} strokeWidth={2.6} color="#10b981" />
          ) : (
            <Smartphone size={15} strokeWidth={2.4} />
          )}
          {isAuthenticating
            ? "Đang xác thực…"
            : isConnected
              ? "Đã kết nối với EcoMetric iOS"
              : "Mô phỏng quét từ iOS App"}
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#10b981] px-4 py-[10px] text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] ${FOCUS}`}
          >
            <Download size={15} strokeWidth={2.6} />
            Tải xuống QR (PNG)
          </button>

          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#e2e8f0] bg-white px-4 py-[10px] text-[13px] font-semibold text-[#0f172a] transition-all hover:bg-[#f8fafc] active:scale-[0.98] ${FOCUS}`}
          >
            {copied ? (
              <Check size={15} strokeWidth={2.8} color="#059669" />
            ) : (
              <Copy size={15} strokeWidth={2.4} />
            )}
            {copied ? "Đã sao chép!" : "Sao chép mã ghép nối"}
          </button>
        </div>

        <button
          type="button"
          onClick={regenerateSession}
          className={`inline-flex items-center justify-center gap-2 rounded-[12px] px-2 py-[6px] text-[12px] font-semibold text-[#64748b] transition-colors hover:text-[#0f172a] ${FOCUS}`}
        >
          <RefreshCw size={13} strokeWidth={2.4} />
          Tạo phiên ghép nối mới
        </button>
      </div>

      {/* Toast thông báo sao chép thành công */}
      {copied && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0f172a] px-4 py-[10px] text-[13px] font-semibold text-white shadow-2xl"
        >
          <Leaf size={15} strokeWidth={2.6} color="#10b981" />
          Đã sao chép mã ghép nối EcoMetric
        </div>
      )}

      {/* Nạp trước logo để bật imageSettings sau khi ảnh sẵn sàng */}
      <img
        src={LEAF_LOGO_URI}
        alt=""
        aria-hidden="true"
        className="hidden"
        onLoad={() => setLogoReady(true)}
      />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Nút QR trong Header + hộp thoại đi kèm ─────────────────── */
export default function QRCodeButton({ size = 200, title, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mã QR chia sẻ"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] transition-colors hover:bg-white ${FOCUS} ${className}`}
      >
        <QrCode size={20} strokeWidth={2} color="#64748b" />
      </button>

      {open && (
        <QRCodeModal
          size={size}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
