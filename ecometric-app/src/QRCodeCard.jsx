/**
 * EcoMetric – Nút mã QR chia sẻ nhanh (dùng trong Header)
 * Stack: React + Tailwind CSS + lucide-react + qrcode.react
 *   npm i qrcode.react
 *
 * Cách dùng:
 *   import QRCodeButton from "./QRCodeCard.jsx";
 *   <QRCodeButton />                                 // dùng link mặc định
 *   <QRCodeButton url="https://vidu.com" size={200} /> // tuỳ biến
 *
 * Xuất kèm `QRCodeModal` nếu chỉ muốn dùng phần hộp thoại.
 *
 * Lưu ý: `imageSettings` cần được cấu hình TRƯỚC khi QR render.
 * Vì logo tải bất đồng bộ, ta bật cờ `logoReady` sau khi ảnh load xong
 * để QRCodeSVG vẽ lại kèm logo ở giữa (excavate để không phá mã).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, Leaf, Link2, QrCode, X } from "lucide-react";

export const DEFAULT_URL = "https://ecometric-dashboard-website.vercel.app/";

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
  url = DEFAULT_URL,
  size = 200,
  title = "Quét mã để mở EcoMetric",
  onClose,
}) {
  const [logoReady, setLogoReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasHostRef = useRef(null);

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

  // Đóng hộp thoại bằng phím Esc
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback cho trình duyệt / ngữ cảnh không có Clipboard API
      const ta = document.createElement("textarea");
      ta.value = url;
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
    link.download = `ecometric-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0f172a]/35 p-4 backdrop-blur-[6px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-share-title"
      onClick={onClose}
    >
      <div
        className="my-auto flex w-full max-w-[380px] flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tiêu đề */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#10b981]/10">
              <QrCode size={18} strokeWidth={2.2} color="#059669" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h2 id="qr-share-title" className="text-[15px] font-bold text-[#0f172a]">
                Chia sẻ EcoMetric qua mã QR
              </h2>
              <p className="text-[12px] text-[#64748b]">{title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng mã QR"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#64748b] transition-all hover:bg-white hover:text-[#0f172a] ${FOCUS}`}
          >
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>

      {/* Mã QR */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-[20px] border border-white/70 bg-white/70 p-4 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur-[12px]">
          {/* Bản SVG hiển thị rõ nét ở mọi kích thước */}
          <QRCodeSVG
            value={url}
            size={size}
            level="H"
            bgColor="#ffffff"
            fgColor="#0f172a"
            marginSize={1}
            title="Mã QR dẫn tới EcoMetric"
            imageSettings={effectiveImageSettings}
            className="block h-auto max-w-full"
          />

          {/* Bản Canvas ẩn, chỉ dùng để xuất PNG đúng kích thước */}
          <div
            ref={canvasHostRef}
            className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0"
          >
            <QRCodeCanvas
              value={url}
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
          <span className="truncate">{url}</span>
        </p>
      </div>

      {/* Hành động */}
      <div className="flex flex-wrap gap-2 border-t border-[#e2e8f0] pt-4">
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
          {copied ? "Đã sao chép!" : "Sao chép liên kết"}
        </button>
      </div>

      {/* Toast thông báo sao chép thành công */}
      {copied && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0f172a] px-4 py-[10px] text-[13px] font-semibold text-white shadow-2xl"
        >
          <Leaf size={15} strokeWidth={2.6} color="#10b981" />
          Đã sao chép liên kết EcoMetric
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
  );
}

/* ── Nút QR trong Header + hộp thoại đi kèm ─────────────────── */
export default function QRCodeButton({
  url = DEFAULT_URL,
  size = 200,
  title,
  className = "",
}) {
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
          url={url}
          size={size}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
