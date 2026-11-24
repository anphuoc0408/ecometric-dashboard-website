/**
 * DataProvenanceTag – Nhãn "nguồn dữ liệu" dùng lại ở nhiều khối.
 * Tách riêng để tránh import vòng giữa các component.
 */
import { Info } from "lucide-react";
import { GRID_FACTOR, PROVENANCE_TEXT } from "../lib/format.js";

export default function DataProvenanceTag({ compact = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ${
        compact ? "whitespace-nowrap" : ""
      }`}
    >
      <Info size={12} strokeWidth={2.4} className="shrink-0 text-slate-400" />
      {compact
        ? `Hệ số lưới điện VN 2024 · ${GRID_FACTOR} kg CO₂e/kWh`
        : PROVENANCE_TEXT}
    </span>
  );
}
