/**
 * DataUploader – Khu vực nhập dữ liệu vận hành bằng tệp (Excel .xlsx / CSV)
 *
 * Chức năng:
 *   1. Kéo–thả (Drag & Drop) hoặc chọn tệp .xlsx / .csv chứa dữ liệu
 *      điện, nước, nhiên liệu.
 *   2. Phân tích tệp thành các dòng dữ liệu và hiển thị BẢNG XEM TRƯỚC
 *      (Preview Table) kèm thống kê nhanh + cảnh báo dòng lỗi.
 *   3. Chỉ khi người dùng bấm "Lưu vào hệ thống" thì mới gọi `onSave(rows)`.
 *   4. Nút "Tải file mẫu (.xlsx)" sinh file mẫu ngay trên trình duyệt.
 *
 * Stack: React + Tailwind CSS v4 + lucide-react
 *
 * ── Ghi chú kỹ thuật về việc đọc tệp ──────────────────────────────
 * Phân tích .xlsx cần một thư viện (SheetJS `xlsx`). Để tránh làm hỏng build
 * khi thư viện chưa được cài, module này import động (dynamic import) và tự
 * phát hiện: nếu `xlsx` có sẵn thì đọc được .xlsx, nếu không thì hiển thị
 * hướng dẫn cài đặt thay vì crash. CSV (không cần thư viện) luôn hoạt động.
 *
 *     npm i xlsx
 */
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Ruler,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

/* ────────────────────────────────
   1. DESIGN TOKENS (kế thừa trang Dữ liệu vận hành)
   ──────────────────────────────── */
const COLOR = {
  emerald: "#10b981",
  emeraldDark: "#059669",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  ink: "#0f172a",
  slate: "#64748b",
  muted: "#94a3b8",
  line: "#e2e8f0",
};

const GLASS = "glass glass-press";
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#10b981] px-4 py-[10px] " +
  `text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#10b981] ${FOCUS}`;
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-4 py-[10px] " +
  `text-[13px] font-semibold text-[#0f172a] backdrop-blur-[12px] transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS}`;

/* ────────────────────────────────
   2. CẤU HÌNH NGHIỆP VỤ
   ──────────────────────────────── */

/** Loại tài nguyên hợp lệ – khớp với RESOURCE_TYPES ở DataInput.jsx. */
const RESOURCE_TYPES = [
  { id: "electricity", label: "Điện năng", unit: "kWh", color: COLOR.emerald },
  { id: "water", label: "Nước", unit: "m³", color: COLOR.blue },
  { id: "fuel", label: "Nhiên liệu", unit: "Lít", color: COLOR.amber },
  { id: "material", label: "Nguyên liệu", unit: "kg", color: COLOR.violet },
];

const RESOURCE_BY_LABEL = Object.fromEntries(
  RESOURCE_TYPES.flatMap((r) => {
    // Ánh xạ cả nhãn hiển thị lẫn id (không phân biệt hoa/thường, bỏ dấu cách).
    const keys = [r.id, r.label];
    if (r.id === "electricity") keys.push("dien", "điện", "electric");
    if (r.id === "water") keys.push("nuoc", "nước");
    if (r.id === "fuel")
      keys.push("nhien lieu", "nhiên liệu", "dau", "dầu", "do", "xang");
    if (r.id === "material") keys.push("nguyen lieu", "nguyên liệu");
    return keys.map((k) => [normalizeKey(k), r.id]);
  }),
);

/** Bỏ dấu tiếng Việt + hạ chữ thường + gộp khoảng trắng → khoá so khớp. */
function normalizeKey(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Các cột bắt buộc trong tệp tải lên (theo header, không phân biệt hoa/thường). */
const REQUIRED_HEADERS = [
  {
    key: "resource",
    aliases: [
      "loai tai nguyen",
      "loại tài nguyên",
      "resource",
      "resource_type",
      "loai",
      "loại",
    ],
  },
  {
    key: "factory",
    aliases: [
      "nha xuong",
      "nhà xưởng",
      "factory",
      "site",
      "chi nhanh",
      "chi nhánh",
    ],
  },
  {
    key: "quantity",
    aliases: [
      "so luong",
      "số lượng",
      "quantity",
      "value",
      "tieu thu",
      "tiêu thụ",
    ],
  },
  { key: "unit", aliases: ["don vi", "đơn vị", "unit"] },
  {
    key: "date",
    aliases: ["ngay ghi nhan", "ngày ghi nhận", "date", "ngay", "ngày"],
  },
];

const MAX_FILE_SIZE_MB = 15;

/* ────────────────────────────────
   3. TIỆN ÍCH ĐỌC & CHUẨN HOÁ TỆP
   ──────────────────────────────── */

/** Đọc tệp CSV thành mảng các dòng (mảng ô) – có xử lý ô được bọc trong "". */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  // Bỏ BOM nếu có (Excel thường thêm \uFEFF ở đầu file UTF-8).
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === ";" || ch === "\t") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  // Bỏ các dòng trống hoàn toàn.
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

/** Đọc tệp .xlsx bằng SheetJS. Import động để không phá build khi thiếu lib. */
async function parseXlsx(file) {
  let XLSX;
  try {
    XLSX = await import("xlsx");
  } catch {
    throw new Error(
      "Chưa cài thư viện đọc Excel. Chạy: npm i xlsx — hoặc lưu bảng tính sang định dạng .csv để tải lên.",
    );
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  // header:1 → trả về mảng 2 chiều thay vì mảng object, giữ nguyên thứ tự cột.
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });
}

/** Tìm chỉ số cột thật khớp với từng cột bắt buộc, dựa trên hàng tiêu đề. */
function mapHeaders(headerRow) {
  const normalized = headerRow.map((h) => normalizeKey(h));
  const map = {};
  REQUIRED_HEADERS.forEach(({ key, aliases }) => {
    const idx = normalized.findIndex((h) =>
      aliases.some((a) => normalizeKey(a) === h),
    );
    if (idx !== -1) map[key] = idx;
  });
  return map;
}

/**
 * Chuyển bảng thô → danh sách bản ghi đã kiểm tra.
 * Mỗi dòng trả về kèm `errors[]`; dòng có lỗi vẫn hiển thị trong bảng xem trước
 * nhưng bị chặn khi lưu.
 */
function toRecords(table) {
  if (!table.length)
    return { records: [], headerErrors: ["Tệp rỗng hoặc không có dữ liệu."] };

  const headerRow = table[0];
  const colMap = mapHeaders(headerRow);

  const missing = REQUIRED_HEADERS.filter(
    (h) => colMap[h.key] === undefined,
  ).map((h) => h.aliases[1] ?? h.key);
  if (missing.length) {
    return {
      records: [],
      headerErrors: [`Thiếu cột bắt buộc: ${missing.join(", ")}.`],
    };
  }

  const records = table.slice(1).map((row, i) => {
    const cell = (key) => String(row[colMap[key]] ?? "").trim();
    const rawType = cell("resource");
    const rawQty = cell("quantity");
    const errors = [];

    const typeId = RESOURCE_BY_LABEL[normalizeKey(rawType)];
    if (!typeId) {
      errors.push(`Loại tài nguyên "${rawType}" không hợp lệ`);
    }

    // Chấp nhận "1.250,5" (vi-VN) lẫn "1250.5" (en-US).
    const qty = Number(rawQty.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.push(`Số lượng "${rawQty}" không hợp lệ`);
    }

    const unit = cell("unit");
    const factory = cell("factory");
    if (!factory) errors.push("Thiếu nhà xưởng");

    return {
      rowNo: i + 2, // +2 vì dòng 1 là tiêu đề
      typeId: typeId ?? null,
      typeLabel: RESOURCE_BY_LABEL[normalizeKey(rawType)]
        ? rawType
        : rawType || "—",
      factory,
      quantity: Number.isFinite(qty) ? qty : 0,
      unit,
      date: cell("date"),
      errors,
    };
  });

  return { records, headerErrors: [] };
}

/** Sinh file mẫu .xlsx (hoặc .csv nếu thiếu thư viện) và kích hoạt tải xuống. */
async function downloadTemplate() {
  const headers = [
    "Loại tài nguyên",
    "Nhà xưởng",
    "Số lượng",
    "Đơn vị",
    "Ngày ghi nhận",
  ];
  const sample = [
    ["Điện năng", "Nhà máy A – Dệt nhuộm", 12500, "kWh", "01/10/2025"],
    ["Nước", "Nhà máy A – Dệt nhuộm", 860, "m³", "01/10/2025"],
    ["Nhiên liệu", "Nhà máy B – May mặc", 420, "Lít", "02/10/2025"],
    ["Nguyên liệu", "Nhà máy C – Xử lý nước", 1500, "kg", "03/10/2025"],
  ];

  try {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    ws["!cols"] = headers.map(() => ({ wch: 26 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Du lieu van hanh");
    XLSX.writeFile(wb, "ecometric-mau-du-lieu-van-hanh.xlsx");
    return ".xlsx";
  } catch {
    // Không có thư viện → xuất CSV, Excel vẫn mở được.
    const csv = [headers, ...sample]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ecometric-mau-du-lieu-van-hanh.csv";
    a.click();
    URL.revokeObjectURL(url);
    return ".csv";
  }
}

/* ────────────────────────────────
   4. THÀNH PHẦN GIAO DIỆN
   ──────────────────────────────── */

/* ── Thẻ thống kê nhỏ trong khu xem trước ──────────────────────── */
function StatChip({ icon: Icon, label, value, accent }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[12px] bg-white/55 px-3 py-[8px] text-[12px] text-[#0f172a]">
      <Icon size={14} strokeWidth={2.4} color={accent} />
      {label}: <b>{value}</b>
    </span>
  );
}

/* ── Vùng kéo–thả tệp ──────────────────────────────────────────── */
function Dropzone({
  dragging,
  onDraggingChange,
  onFile,
  fileName,
  onClear,
  error,
}) {
  const inputRef = useRef(null);

  const pick = (files) => {
    if (!files?.length) return;
    onFile(files[0]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          onDraggingChange(true);
        }}
        onDragLeave={() => onDraggingChange(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDraggingChange(false);
          pick(e.dataTransfer.files);
        }}
        className={`${GLASS} flex flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? "border-[#10b981] bg-[#10b981]/10"
            : "border-[#10b981]/50 bg-white/45"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981]/12">
          <CloudUpload size={24} strokeWidth={2} color={COLOR.emeraldDark} />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-bold text-[#0f172a]">
            {fileName ? "Tệp đã chọn" : "Kéo thả tệp dữ liệu vào đây"}
          </p>
          <p className="text-[12px] text-[#94a3b8]">
            Hỗ trợ .XLSX và .CSV · tối đa {MAX_FILE_SIZE_MB}MB · gồm cột Loại
            tài nguyên, Nhà xưởng, Số lượng, Đơn vị, Ngày ghi nhận
          </p>
        </div>

        {fileName && (
          <div className="flex items-center gap-2 rounded-[10px] bg-white/75 px-3 py-[7px]">
            <FileSpreadsheet
              size={15}
              strokeWidth={2}
              color={COLOR.emeraldDark}
            />
            <span className="max-w-[240px] truncate text-[12px] font-semibold text-[#0f172a]">
              {fileName}
            </span>
            <button
              type="button"
              aria-label="Xoá tệp"
              onClick={onClear}
              className={`text-[#94a3b8] transition-colors hover:text-[#ef4444] ${FOCUS}`}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files);
            // Reset value để chọn lại đúng tệp vừa xoá vẫn kích hoạt onChange.
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={BTN_GHOST}
        >
          <Upload size={15} strokeWidth={2.4} />
          {fileName ? "Chọn tệp khác" : "Chọn tệp từ máy"}
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-[12px] bg-[#fee2e2] px-4 py-3 text-[12px] font-semibold text-[#991b1b]">
          <AlertTriangle
            size={14}
            strokeWidth={2.6}
            className="mt-[2px] shrink-0"
          />
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Bảng xem trước dữ liệu đã phân tích ───────────────────────── */
function PreviewTable({ records }) {
  const COLS = [
    { key: "rowNo", label: "Dòng", cls: "w-[70px] shrink-0 text-[#94a3b8]" },
    { key: "type", label: "Loại tài nguyên", cls: "w-[160px] shrink-0" },
    {
      key: "factory",
      label: "Nhà xưởng",
      cls: "min-w-[200px] flex-1 truncate",
    },
    { key: "qty", label: "Số lượng", cls: "w-[130px] shrink-0 text-right" },
    { key: "date", label: "Ngày ghi nhận", cls: "w-[130px] shrink-0" },
    { key: "status", label: "Trạng thái", cls: "w-[150px] shrink-0" },
  ];

  return (
    <div className="overflow-x-auto">
      <div
        className="min-w-[900px]"
        role="table"
        aria-label="Bảng xem trước dữ liệu tải lên"
      >
        <div
          role="row"
          className="flex items-center gap-4 rounded-t-[12px] border-white/60 bg-white/55 px-4 py-[10px] text-[12px] font-semibold text-[#64748b] backdrop-blur-[12px]"
        >
          {COLS.map((c) => (
            <span key={c.key} role="columnheader" className={c.cls}>
              {c.label}
            </span>
          ))}
        </div>

        {records.map((r, idx) => {
          const type = r.typeId
            ? RESOURCE_TYPES.find((t) => t.id === r.typeId)
            : null;
          const bad = r.errors.length > 0;
          return (
            <div
              key={r.rowNo}
              role="row"
              className={`flex items-center gap-4 border-t-0 border-white/60 px-4 py-3 text-[13px] transition-colors hover:bg-white/70 ${
                idx === records.length - 1 ? "rounded-b-[12px]" : ""
              } ${bad ? "bg-[#fee2e2]/40" : idx % 2 === 1 ? "bg-white/30" : "bg-white/45"}`}
            >
              <span role="cell" className={COLS[0].cls}>
                {r.rowNo}
              </span>

              <span role="cell" className={COLS[1].cls}>
                {type ? (
                  <span
                    className="inline-flex items-center gap-[6px] rounded-[8px] px-[10px] py-[5px] text-[12px] font-semibold"
                    style={{
                      backgroundColor: `${type.color}1f`,
                      color: type.color,
                    }}
                  >
                    {type.label}
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold text-[#991b1b]">
                    {r.typeLabel}
                  </span>
                )}
              </span>

              <span role="cell" className={`${COLS[2].cls} text-[#0f172a]`}>
                {r.factory || "—"}
              </span>

              <span
                role="cell"
                className={`${COLS[3].cls} font-semibold text-[#0f172a]`}
              >
                {r.quantity.toLocaleString("vi-VN")} {r.unit}
              </span>

              <span role="cell" className={`${COLS[4].cls} text-[#64748b]`}>
                {r.date || "—"}
              </span>

              <span role="cell" className={COLS[5].cls}>
                {bad ? (
                  <span
                    className="inline-flex items-start gap-[6px] rounded-[8px] bg-[#fee2e2] px-[10px] py-[5px] text-[11px] font-semibold text-[#991b1b]"
                    title={r.errors.join(" · ")}
                  >
                    <X
                      size={12}
                      strokeWidth={2.8}
                      className="mt-[1px] shrink-0"
                    />
                    {r.errors.length} lỗi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-[6px] rounded-[8px] bg-[#10b981]/14 px-[10px] py-[5px] text-[11px] font-semibold text-[#059669]">
                    <Check size={12} strokeWidth={2.8} />
                    Hợp lệ
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────
   5. COMPONENT CHÍNH
   ──────────────────────────────── */

/**
 * @param {(rows: object[]) => void} [onSave] – nhận danh sách bản ghi hợp lệ
 *        khi người dùng bấm "Lưu vào hệ thống".
 */
export default function DataUploader({ onSave }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  // Kết quả phân tích tệp: danh sách dòng + lỗi ở cấp tiêu đề (nếu có).
  const [allRecords, setAllRecords] = useState([]);
  const [headerErrors, setHeaderErrors] = useState([]);

  // Gán cả hai state trong một lần cập nhật để tránh setState rải rác.
  const applyParseResult = (rows, hErr = []) => {
    setAllRecords(rows);
    setHeaderErrors(hErr);
  };

  const valid = useMemo(
    () => allRecords.filter((r) => r.errors.length === 0),
    [allRecords],
  );
  const invalidCount = allRecords.length - valid.length;

  const summary = useMemo(() => {
    const byType = {};
    valid.forEach((r) => {
      byType[r.typeId] = (byType[r.typeId] ?? 0) + r.quantity;
    });
    return byType;
  }, [valid]);

  const handleFile = async (file) => {
    setError("");
    setSavedMsg("");
    setFileName(file.name);

    // Kiểm tra đuôi tệp.
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      setError("Chỉ hỗ trợ tệp .xlsx hoặc .csv.");
      applyParseResult([], []);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Tệp vượt quá ${MAX_FILE_SIZE_MB}MB.`);
      applyParseResult([], []);
      return;
    }

    setParsing(true);
    try {
      const table =
        ext === "csv" ? parseCsv(await file.text()) : await parseXlsx(file);
      const { records: rows, headerErrors: hErr } = toRecords(table);
      applyParseResult(rows, hErr);
      if (hErr.length) setError(hErr.join(" "));
    } catch (err) {
      setError(
        err?.message ?? "Không đọc được tệp. Vui lòng kiểm tra lại định dạng.",
      );
      applyParseResult([], []);
    } finally {
      setParsing(false);
    }
  };

  const clearFile = () => {
    setFileName("");
    setError("");
    setSavedMsg("");
    applyParseResult([], []);
  };

  const handleSave = () => {
    if (!valid.length) return;
    onSave?.(valid);
    setSavedMsg(`Đã lưu ${valid.length} bản ghi vào hệ thống.`);
    // TODO: gọi API lưu bản ghi tại đây (src/services/api.js).
  };

  const hasFile = Boolean(fileName);
  const canSave = valid.length > 0;

  // Lỗi ở cấp tiêu đề (thiếu cột) cần hiển thị riêng, rõ ràng hơn lỗi từng dòng.
  const showHeaderErrors = headerErrors.length > 0;

  return (
    <section className={`${GLASS} flex-col gap-4 p-4 sm:gap-5 sm:p-6`}>
      {/* Tiêu đề + nút tải file mẫu */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-[#0f172a]">
            Nhập dữ liệu từ tệp Excel / CSV
          </h2>
          <p className="text-[12px] text-[#64748b]">
            Kéo thả tệp chứa dữ liệu điện, nước, nhiên liệu · xem trước và kiểm
            tra trước khi lưu
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const ext = await downloadTemplate();
            setSavedMsg(`Đã tải file mẫu ${ext}.`);
          }}
          className={BTN_GHOST}
        >
          <Download size={15} strokeWidth={2.4} />
          Tải file mẫu (.xlsx)
        </button>
      </div>

      {/* Vùng kéo thả */}
      <Dropzone
        dragging={dragging}
        onDraggingChange={setDragging}
        onFile={handleFile}
        fileName={fileName}
        onClear={clearFile}
        error={error}
      />

      {/* Lỗi cấu trúc cột – hiển thị chi tiết các cột còn thiếu */}
      {showHeaderErrors && (
        <div className="flex flex-col gap-2 rounded-[12px] bg-[#fee2e2] px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] font-bold text-[#991b1b]">
            <AlertTriangle size={14} strokeWidth={2.6} />
            Tệp không đúng cấu trúc
          </p>
          <ul className="flex flex-col gap-[3px] pl-5 text-[12px] text-[#991b1b]">
            {headerErrors.map((msg) => (
              <li key={msg} className="list-disc">
                {msg}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#b91c1c]">
            Cột bắt buộc: Loại tài nguyên · Nhà xưởng · Số lượng · Đơn vị · Ngày
            ghi nhận.
          </p>
        </div>
      )}

      {/* Đang phân tích */}
      {parsing && (
        <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#64748b]">
          <Loader2 size={15} strokeWidth={2.4} className="animate-spin" />
          Đang phân tích tệp…
        </p>
      )}

      {/* Bảng xem trước */}
      {allRecords.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[14px] font-bold text-[#0f172a]">
              Xem trước dữ liệu
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <StatChip
                icon={FileSpreadsheet}
                label="Tổng dòng"
                value={allRecords.length}
                accent={COLOR.blue}
              />
              <StatChip
                icon={BadgeCheck}
                label="Hợp lệ"
                value={valid.length}
                accent={COLOR.emeraldDark}
              />
              {invalidCount > 0 && (
                <StatChip
                  icon={AlertTriangle}
                  label="Có lỗi"
                  value={invalidCount}
                  accent={COLOR.red}
                />
              )}
            </div>
          </div>

          {/* Tổng hợp theo loại tài nguyên */}
          {Object.keys(summary).length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {RESOURCE_TYPES.filter((t) => summary[t.id]).map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold"
                  style={{ backgroundColor: `${t.color}1f`, color: t.color }}
                >
                  <Ruler size={12} strokeWidth={2.6} />
                  {t.label}: {summary[t.id].toLocaleString("vi-VN")} {t.unit}
                </span>
              ))}
            </div>
          )}

          <PreviewTable records={allRecords} />

          {invalidCount > 0 && (
            <p className="flex items-start gap-2 rounded-[12px] bg-[#fef3c7] px-4 py-3 text-[12px] text-[#b45309]">
              <Info size={14} strokeWidth={2.6} className="mt-[2px] shrink-0" />
              <span>
                <b>{invalidCount} dòng có lỗi</b> sẽ bị bỏ qua khi lưu. Di chuột
                vào nhãn “lỗi” để xem chi tiết, sửa lại trong tệp rồi tải lên
                lần nữa.
              </span>
            </p>
          )}

          {/* Hành động */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-4">
            <p className="max-w-[520px] text-[11px] leading-[1.5] text-[#94a3b8]">
              Chỉ {valid.length} dòng hợp lệ được lưu. Dữ liệu sau khi lưu sẽ
              được dùng để tính chỉ số CO₂e và chi phí.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={clearFile} className={BTN_GHOST}>
                <Trash2 size={15} strokeWidth={2.4} />
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className={BTN_PRIMARY}
              >
                <Save size={15} strokeWidth={2.6} />
                Lưu vào hệ thống
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Không có tệp → gợi ý */}
      {!hasFile && !parsing && (
        <p className="flex items-start gap-2 rounded-[12px] bg-white/55 px-4 py-3 text-[12px] text-[#64748b]">
          <Info
            size={14}
            strokeWidth={2.4}
            color={COLOR.emeraldDark}
            className="mt-[2px] shrink-0"
          />
          <span>
            Chưa có tệp nào được chọn. Bấm <b>Tải file mẫu (.xlsx)</b> để xem
            đúng định dạng cột cần điền.
          </span>
        </p>
      )}

      {savedMsg && (
        <span className="glass inline-flex w-fit items-center gap-2 px-4 py-[10px] text-[12px] font-semibold text-[#059669]">
          <BadgeCheck size={15} strokeWidth={2.6} />
          {savedMsg}
        </span>
      )}
    </section>
  );
}
