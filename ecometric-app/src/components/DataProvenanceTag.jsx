/**
 * DataProvenanceTag – Nhãn "nguồn dữ liệu" dùng lại ở nhiều khối.
 * Tách riêng để tránh import vòng giữa các component.
 */
import { Info } from "lucide-react";
import { GRID_FACTOR, PROVENANCE_TEXT } from "../lib/format.js";

export default function DataProvenanceTag({ compact = false }) {
  return (
    <span
      className={`inline-flex items-center gap-[6px] rounded-full bg-[#dbeafe] px-[10px] py-[4px] text-[11px] font-semibold leading-snug text-[#1d4ed8] ${
        compact ? "whitespace-nowrap" : ""
      }`}
    >
      <Info size={12} strokeWidth={2.6} className="shrink-0" />
      {compact
        ? `Hệ số lưới điện VN 2024 · ${GRID_FACTOR} kg CO₂e/kWh`
        : PROVENANCE_TEXT}
    </span>
  );
}
