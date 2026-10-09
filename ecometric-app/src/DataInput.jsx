/**
 * EcoMetric – Màn hình 2: Dữ liệu vận hành
 * Phong cách: Apple "iOS Liquid Glass" (glass / glass-thin / glass-press từ index.css)
 *
 * Stack: React + Tailwind CSS v4 + lucide-react
 * Gồm 2 khối chính:
 *   1. Form nhập liệu tiêu thụ năng lượng / nguyên liệu (+ upload hoá đơn)
 *   2. Bảng danh sách bản ghi dữ liệu vận hành – có lọc theo loại tài nguyên & phân trang
 */
import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Filter,
  Factory,
  Hash,
  Leaf,
  Ruler,
  Search,
  Trash2,
  Zap,
} from "lucide-react";

import DataUploader from "./components/DataUploader.jsx";

/* ────────────────────────────────
   1. DESIGN TOKENS (kế thừa bảng màu của Dashboard)
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

// Lớp bề mặt kính – dùng lại utility "glass" đã khai báo trong index.css
const GLASS = "glass glass-press";
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]";

// Ô nhập liệu kiểu iOS: kính mỏng, bo tròn, đổ bóng nhẹ, focus viền emerald
const FIELD =
  "w-full rounded-[12px] border-white/70 bg-white/60 px-3 py-[10px] text-[13px] text-[#0f172a] " +
  "placeholder:text-[#94a3b8] outline-none backdrop-blur-[12px] transition-shadow " +
  "focus:border-[#10b981]/60 focus:bg-white/85 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]";
// Đệm trong thẻ kính: nhỏ hơn trên di động (rộng rãi cho nội dung), đủ thoáng từ sm.
const GLASS_PAD_MD = `${GLASS} flex-col gap-4 p-4 sm:gap-5 sm:p-6`;
const LABEL = "flex items-center gap-[6px] text-[12px] font-semibold text-[#64748b]";

/* ────────────────────────────────
   2. DANH MỤC & DỮ LIỆU MẪU (thay bằng API sau này)
   ──────────────────────────────── */
const RESOURCE_TYPES = [
  { id: "electricity", label: "Điện năng", unit: "kWh", icon: Zap, color: COLOR.emerald },
  { id: "water", label: "Nước", unit: "m³", icon: Ruler, color: COLOR.blue },
  { id: "fuel", label: "Nhiên liệu", unit: "Lít", icon: Factory, color: COLOR.amber },
  { id: "material", label: "Nguyên liệu", unit: "kg", icon: Leaf, color: COLOR.violet },
];

const RESOURCE_BY_ID = Object.fromEntries(RESOURCE_TYPES.map((r) => [r.id, r]));

const UNITS = ["kWh", "m³", "Lít", "kg", "Tấn", "Bao", "Thùng"];

const FACTORIES = [
  "Nhà máy A – Dệt nhuộm",
  "Nhà máy B – May mặc",
  "Nhà máy C – Xử lý nước",
  "Kho trung tâm – Logistics",
];

// Sinh nhanh dữ liệu mẫu để bảng có nội dung hiển thị
const SAMPLE_RECORDS = Array.from({ length: 47 }, (_, i) => {
  const type = RESOURCE_TYPES[i % RESOURCE_TYPES.length];
  const factory = FACTORIES[i % FACTORIES.length];
  const day = ((i * 3) % 28) + 1;
  const month = ((i * 5) % 9) + 1;
  const qty = Math.round(((i * 137) % 900) + 60 + (i % 10) * 1.5);
  return {
    id: `REC-${String(1000 + i)}`,
    typeId: type.id,
    factory,
    quantity: qty,
    unit: type.unit,
    date: `${String(day).padStart(2, "0")}/10/2025`,
    createdMonth: `T${month}`,
    invoice: i % 4 === 0 ? "" : `hoa-don-${1000 + i}.pdf`,
  };
});

/* ────────────────────────────────
   3. THÀNH PHẦN GIAO DIỆN
   ──────────────────────────────── */

/* ── Bộ chọn loại tài nguyên (segmented chips) ─────────────────── */
function TypePicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Loại tài nguyên" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {RESOURCE_TYPES.map(({ id, label, unit, icon: Icon, color }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`glass-press flex items-center gap-2 rounded-[12px] border px-3 py-[10px] text-left transition-all ${FOCUS} ${
              active
                ? "border-[#10b981]/60 bg-white/85 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]"
                : "border-white/60 bg-white/45 hover:bg-white/70"
            }`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
              style={{ backgroundColor: `${color}1f` }}
            >
              <Icon size={16} strokeWidth={2} color={color} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-[#0f172a]">{label}</span>
              <span className="text-[11px] text-[#94a3b8]">{unit}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Khu vực upload hoá đơn (drag & drop) ──────────────────────── */
function InvoiceDropzone({ fileName, onPick, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    if (!files?.length) return;
    onPick(files[0]);
    // TODO: gửi files[0] lên API tại đây
  };

  return (
    <div
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
      className={`glass-press flex-col items-center justify-center gap-3 rounded-[16px] border-dashed p-5 text-center transition-colors ${
        dragging ? "border-[#10b981] bg-[#10b981]/10" : "border-[#10b981]/60 bg-white/45"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#10b981]/12">
        <CloudUpload size={22} strokeWidth={2} color={COLOR.emeraldDark} />
      </div>

      {fileName ? (
        <div className="flex items-center gap-2 rounded-[10px] bg-white/70 px-3 py-[6px]">
          <FileSpreadsheet size={15} strokeWidth={2} color={COLOR.emeraldDark} />
          <span className="max-w-[220px] truncate text-[12px] font-semibold text-[#0f172a]">{fileName}</span>
          <button
            type="button"
            aria-label="Xoá tệp"
            onClick={onClear}
            className={`text-[#94a3b8] transition-colors hover:text-[#ef4444] ${FOCUS}`}
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-[#0f172a]">Hoá đơn / Chứng từ</p>
          <p className="text-[11px] text-[#94a3b8]">Kéo thả hoặc chọn tệp (.PDF, .JPG, .PNG – tối đa 15MB)</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`rounded-[10px] border-white/70 bg-white/70 px-4 py-[7px] text-[12px] font-semibold text-[#059669] transition-colors hover:bg-white ${FOCUS}`}
      >
        {fileName ? "Chọn tệp khác" : "Chọn tệp từ máy"}
      </button>
    </div>
  );
}

/* ── Form nhập liệu tiêu thụ ───────────────────── */
function ConsumptionForm({ onAdd }) {
  const [typeId, setTypeId] = useState(RESOURCE_TYPES[0].id);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(RESOURCE_TYPES[0].unit);
  const [factory, setFactory] = useState(FACTORIES[0]);
  const [date, setDate] = useState("2025-10-12");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      setError("Vui lòng nhập số lượng tiêu thụ lớn hơn 0.");
      return;
    }
    setError("");

    const [y, m, d] = date.split("-");
    onAdd({
      id: `REC-${Math.floor(2000 + Math.random() * 8000)}`,
      typeId,
      factory,
      quantity: Number(quantity),
      unit,
      date: d && m && y ? `${d}/${m}/${y}` : date,
      invoice: fileName,
    });

    // Reset form về trạng thái ban đầu
    setQuantity("");
    setFileName("");
    setTypeId(RESOURCE_TYPES[0].id);
    setUnit(RESOURCE_TYPES[0].unit);
  };

  return (
    <section className={`${GLASS_PAD_MD} p-4 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-[#0f172a]">Nhập liệu tiêu thụ năng lượng / nguyên liệu</h2>
          <p className="text-[12px] text-[#64748b]">Ghi nhận số liệu vận hành theo nhà xưởng và kỳ báo cáo</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#10b981]/12 px-3 py-[6px] text-[11px] font-semibold text-[#059669]">
          <Leaf size={13} strokeWidth={2.4} />
          Chuẩn hoá ESG
        </span>
      </div>

      <TypePicker
        value={typeId}
        onChange={(id) => {
          setTypeId(id);
          setUnit(RESOURCE_BY_ID[id].unit);
        }}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Số lượng */}
          <label className="flex flex-col gap-[6px]">
            <span className={LABEL}>
              <Hash size={13} strokeWidth={2.4} /> Số lượng
            </span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="VD: 1 250"
              className={FIELD}
            />
          </label>

          {/* Đơn vị */}
          <label className="flex flex-col gap-[6px]">
            <span className={LABEL}>
              <Ruler size={13} strokeWidth={2.4} /> Đơn vị
            </span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={FIELD}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          {/* Nhà xưởng */}
          <label className="flex flex-col gap-[6px]">
            <span className={LABEL}>
              <Factory size={13} strokeWidth={2.4} /> Nhà xưởng
            </span>
            <select value={factory} onChange={(e) => setFactory(e.target.value)} className={FIELD}>
              {FACTORIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          {/* Ngày ghi nhận */}
          <label className="flex flex-col gap-[6px]">
            <span className={LABEL}>
              <CalendarDays size={13} strokeWidth={2.4} /> Ngày ghi nhận
            </span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          <InvoiceDropzone fileName={fileName} onPick={(f) => setFileName(f.name)} onClear={() => setFileName("")} />

          <div className="flex flex-col items-stretch justify-end gap-2 lg:w-[220px]">
            {error && (
              <p className="rounded-[10px] bg-[#fee2e2] px-3 py-2 text-[11px] font-semibold text-[#991b1b]">
                {error}
              </p>
            )}
            <button
              type="submit"
              className={`rounded-[12px] bg-[#059669] px-6 py-[11px] text-[13px] font-semibold text-white transition-all hover:bg-[#047857] active:scale-[0.98] ${FOCUS}`}
            >
              + Thêm bản ghi
            </button>
            <button
              type="button"
              onClick={() => {
                setQuantity("");
                setFileName("");
                setError("");
              }}
              className={`rounded-[12px] border-white/70 bg-white/60 px-6 py-[11px] text-[13px] font-semibold text-[#64748b] transition-colors hover:bg-white ${FOCUS}`}
            >
              Xoá trắng
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

/* ── Nhãn loại tài nguyên trong bảng ───────────────────────────── */
function TypeBadge({ typeId }) {
  const type = RESOURCE_BY_ID[typeId] ?? RESOURCE_TYPES[0];
  const Icon = type.icon;
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-[8px] px-[10px] py-[5px] text-[12px] font-semibold"
      style={{ backgroundColor: `${type.color}1f`, color: type.color }}
    >
      <Icon size={13} strokeWidth={2.4} />
      {type.label}
    </span>
  );
}

/* ── Thanh lọc theo loại tài nguyên + tìm kiếm ─────────────────── */
function FilterBar({ activeType, onTypeChange, query, onQueryChange, total }) {
  const tabs = [{ id: "all", label: "Tất cả" }, ...RESOURCE_TYPES.map((r) => ({ id: r.id, label: r.label }))];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${LABEL} mr-1`}>
          <Filter size={13} strokeWidth={2.4} /> Lọc theo loại tài nguyên
        </span>
        {tabs.map(({ id, label }) => {
          const active = id === activeType;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTypeChange(id)}
              aria-pressed={active}
              className={`glass-press rounded-full border px-[14px] py-[6px] text-[12px] font-semibold transition-all ${FOCUS} ${
                active
                  ? "border-transparent bg-[#10b981] text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.8)]"
                  : "border-white/60 bg-white/50 text-[#64748b] hover:bg-white/80"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap text-[12px] text-[#94a3b8]">{total} bản ghi</span>
        <label className="flex items-center gap-2 rounded-[10px] border-white/70 bg-white/60 px-3 py-2 backdrop-blur-[12px] focus-within:border-[#10b981]/60">
          <Search size={15} strokeWidth={2} color={COLOR.muted} className="shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm mã / nhà xưởng..."
            className="h-4 w-[170px] min-w-0 bg-transparent text-[12px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
          />
        </label>
      </div>
    </div>
  );
}

/* ── Phân trang ────────────────── */
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Cửa sổ số trang quanh trang hiện tại
  const pages = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let p = Math.max(1, start); p <= end; p += 1) pages.push(p);

  const btn =
    "flex h-8 min-w-8 items-center justify-center rounded-[9px] border text-[12px] font-semibold transition-all " +
    FOCUS;

  return (
    <nav className="flex items-center gap-2" aria-label="Phân trang">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Trang trước"
        className={`${btn} border-white/60 bg-white/55 text-[#64748b] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <ChevronLeft size={15} strokeWidth={2.4} />
      </button>

      {pages[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className={`${btn} border-white/60 bg-white/55 px-[10px] text-[#64748b] hover:bg-white`}
          >
            1
          </button>
          {pages[0] > 2 && <span className="text-[12px] text-[#94a3b8]">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${btn} px-[10px] ${
            p === page
              ? "border-transparent bg-[#10b981] text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.8)]"
              : "border-white/60 bg-white/55 text-[#64748b] hover:bg-white"
          }`}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-[12px] text-[#94a3b8]">…</span>}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className={`${btn} border-white/60 bg-white/55 px-[10px] text-[#64748b] hover:bg-white`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Trang sau"
        className={`${btn} border-white/60 bg-white/55 text-[#64748b] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <ChevronRight size={15} strokeWidth={2.4} />
      </button>
    </nav>
  );
}

/* ── Bảng danh sách bản ghi ────────────────────── */
function RecordsTable({ records }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Đổi bộ lọc thì quay về trang 1
  const changeType = (t) => {
    setTypeFilter(t);
    setPage(1);
  };
  const changeQuery = (q) => {
    setQuery(q);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const matchType = typeFilter === "all" || r.typeId === typeFilter;
      const matchQuery =
        !q || r.id.toLowerCase().includes(q) || r.factory.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [records, typeFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);

  const COLS = [
    { key: "id", label: "Mã bản ghi", cls: "w-[110px] shrink-0" },
    { key: "type", label: "Loại tài nguyên", cls: "w-[170px] shrink-0" },
    { key: "factory", label: "Nhà xưởng", cls: "min-w-[200px] flex-1" },
    { key: "qty", label: "Số lượng", cls: "w-[130px] shrink-0 text-right" },
    { key: "date", label: "Ngày ghi nhận", cls: "w-[130px] shrink-0" },
    { key: "invoice", label: "Hoá đơn", cls: "w-[120px] shrink-0" },
  ];

  return (
    <section className={`${GLASS_PAD_MD} p-4 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-[#0f172a]">Danh sách bản ghi dữ liệu vận hành</h2>
          <p className="text-[12px] text-[#64748b]">
            Toàn bộ số liệu tiêu thụ đã khai báo – tra cứu, lọc và xuất báo cáo
          </p>
        </div>
        <button
          type="button"
          className={`flex items-center gap-2 rounded-[10px] bg-[#10b981] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] ${FOCUS}`}
        >
          <Download size={15} strokeWidth={2.4} />
          Xuất dữ liệu
        </button>
      </div>

      <FilterBar
        activeType={typeFilter}
        onTypeChange={changeType}
        query={query}
        onQueryChange={changeQuery}
        total={filtered.length}
      />

      <div className="overflow-x-auto">
        <div className="min-w-[880px]" role="table" aria-label="Danh sách bản ghi dữ liệu vận hành">
          {/* Header */}
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

          {/* Rows */}
          {pageRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-b-[12px] border-t-0 border-white/60 bg-white/40 px-4 py-12 text-center">
              <Search size={22} strokeWidth={2} color={COLOR.muted} />
              <p className="text-[13px] font-semibold text-[#64748b]">Không tìm thấy bản ghi phù hợp</p>
              <p className="text-[12px] text-[#94a3b8]">Thử đổi bộ lọc loại tài nguyên hoặc từ khoá tìm kiếm.</p>
            </div>
          ) : (
            pageRows.map((r, idx) => (
              <div
                key={r.id}
                role="row"
                className={`flex items-center gap-4 border-t-0 border-white/60 px-4 py-3 text-[13px] transition-colors hover:bg-white/70 ${
                  idx === pageRows.length - 1 ? "rounded-b-[12px]" : ""
                } ${idx % 2 === 1 ? "bg-white/30" : "bg-white/45"}`}
              >
                <span role="cell" className={`${COLS[0].cls} font-semibold text-[#0f172a]`}>
                  {r.id}
                </span>
                <span role="cell" className={COLS[1].cls}>
                  <TypeBadge typeId={r.typeId} />
                </span>
                <span role="cell" className={`${COLS[2].cls} truncate text-[#0f172a]`}>
                  {r.factory}
                </span>
                <span role="cell" className={`${COLS[3].cls} font-semibold text-[#0f172a]`}>
                  {r.quantity.toLocaleString("vi-VN")} {r.unit}
                </span>
                <span role="cell" className={`${COLS[4].cls} text-[#64748b]`}>
                  {r.date}
                </span>
                <span role="cell" className={COLS[5].cls}>
                  {r.invoice ? (
                    <button
                      type="button"
                      className={`inline-flex items-center gap-[6px] text-[12px] font-semibold text-[#059669] hover:underline ${FOCUS}`}
                    >
                      <FileSpreadsheet size={13} strokeWidth={2.4} />
                      Xem tệp
                    </button>
                  ) : (
                    <span className="text-[12px] text-[#94a3b8]">Chưa có</span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Phân trang */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="text-[12px] text-[#64748b]">
          Hiển thị{" "}
          <b className="text-[#0f172a]">
            {filtered.length === 0 ? 0 : (current - 1) * pageSize + 1}–{Math.min(current * pageSize, filtered.length)}
          </b>{" "}
          trên <b className="text-[#0f172a]">{filtered.length}</b> bản ghi
        </span>
        <Pagination page={current} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </section>
  );
}

/* ────────────────────────────────
   4. TRANG DỮ LIỆU VẬN HÀNH
   ──────────────────────────────── */
export default function DataInput() {
  const [records, setRecords] = useState(SAMPLE_RECORDS);

  const addRecord = (record) =>
    setRecords((prev) => [{ ...record, id: `${record.id}` }, ...prev]);

  // Nhận danh sách bản ghi hợp lệ từ DataUploader (tệp Excel/CSV) và thêm vào bảng.
  const addRecords = (rows) =>
    setRecords((prev) => [
      ...rows.map((r, i) => ({
        id: `IMP-${Date.now().toString(36).toUpperCase()}-${i + 1}`,
        typeId: r.typeId,
        factory: r.factory,
        quantity: r.quantity,
        unit: r.unit,
        date: r.date,
        invoice: "",
      })),
      ...prev,
    ]);

  return (
    <main className="flex min-h-[calc(100vh-73px)] min-w-0 flex-1 flex-col gap-5 p-4 pb-24 sm:gap-6 sm:p-6 lg:pb-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col gap-[6px]">
        <h1 className="text-[20px] font-extrabold leading-tight text-[#0f172a] sm:text-[24px]">Dữ liệu vận hành</h1>
        <p className="text-[13px] leading-snug text-[#64748b] sm:text-[14px]">
          Nhập liệu tiêu thụ năng lượng, nước, nhiên liệu và nguyên liệu theo nhà xưởng
        </p>
      </div>

      {/* Nhập dữ liệu từ tệp Excel / CSV (kéo-thả + xem trước) */}
      <DataUploader onSave={addRecords} />

      {/* Form nhập liệu thủ công */}
      <ConsumptionForm onAdd={addRecord} />

      {/* Bảng danh sách + lọc + phân trang */}
      <RecordsTable records={records} />
    </main>
  );
}
