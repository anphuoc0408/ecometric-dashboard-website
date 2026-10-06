/**
 * UploadCard – Nhập dữ liệu / Tải file vận hành (drag & drop).
 *
 * Responsive: padding và kích thước vùng thả thu gọn trên mobile,
 * nút tải lên full-width đủ vùng chạm.
 */
import { useRef, useState } from "react";
import { CloudUpload } from "lucide-react";
import { BTN_PRIMARY, COLOR } from "../lib/format.js";

export default function UploadCard() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFiles = (files) => {
    if (!files?.length) return;
    setFileName(files[0].name);
    // TODO: gửi files[0] lên API của bạn tại đây
  };

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#10b981] p-5 shadow-[0_2px_2px_rgba(0,0,0,0.02)] transition-colors sm:p-6 ${
        dragging ? "bg-[#10b981]/5" : "bg-white"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981]/10">
        <CloudUpload size={24} strokeWidth={2} color={COLOR.emeraldDark} />
      </div>

      <div className="flex w-full flex-col items-center gap-1 text-center">
        <p className="text-[15px] font-bold text-[#0f172a]">
          Nhập dữ liệu / Tải file vận hành
        </p>
        <p className="text-[12px] leading-snug text-[#64748b]">
          Kéo và thả tệp hoặc chọn file từ máy tính của bạn
        </p>
        <p className="text-[11px] leading-snug text-[#94a3b8]">
          {fileName
            ? `Đã chọn: ${fileName}`
            : "Hỗ trợ các định dạng: .CSV, .Excel, .JSON (Tối đa 15MB)"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${BTN_PRIMARY} sm:w-auto sm:px-6`}
      >
        Tải lên tài liệu
      </button>
    </section>
  );
}
