/**
 * EcoMetric – Tiện ích xuất tệp (Excel .xlsx & Báo cáo PDF)
 *
 * Mục đích: gom toàn bộ logic kết xuất dữ liệu chỉ số phát thải Carbon
 * (Scope 1 / 2 / 3) và chỉ số ESG vào một chỗ, để component chỉ gọi
 * `exportToExcel(...)` / `exportToPdf(...)` và không phải biết gì về
 * SheetJS hay jsPDF.
 *
 * ── Vì sao import động (dynamic import)? ────────────────────────────
 * Cả `xlsx` (~424 kB) lẫn `jspdf` (~390 kB) đều là thư viện nặng và chỉ dùng
 * khi người dùng thực sự bấm nút xuất. Import động giúp Vite tách chúng thành
 * chunk riêng → trang vẫn nhẹ, thư viện chỉ tải khi cần.
 *
 * ── Về font tiếng Việt trong PDF ────────────────────────────────────
 * Font mặc định của jsPDF (Helvetica) CHỈ hỗ trợ Latin-1, không có glyph cho
 * "ệ", "ộ", "₂"... nên chữ tiếng Việt sẽ bị vỡ/văng ra ngoài ô. Để tránh phải
 * nhúng cả file font Unicode (nặng vài trăm kB), module này chuyển tiếng Việt
 * về dạng ASCII không dấu khi ghi vào PDF (xem `deaccent`). Bản Excel thì giữ
 * nguyên dấu vì SheetJS hỗ trợ UTF-8 đầy đủ.
 */

/* ────────────────────────────────
   1. TIỆN ÍCH DÙNG CHUNG
   ──────────────────────────────── */

/** Ngày giờ dạng `2025-10-24_1430` – dùng làm hậu tố tên tệp. */
function stamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(date.getHours())}${p(date.getMinutes())}`;
}

/**
 * Bỏ dấu tiếng Việt → ASCII (dùng cho PDF, nơi font mặc định không có dấu).
 * Giữ lại "đ/Đ" → "d/D" và các ký tự cần thiết khác.
 */
export function deaccent(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ toàn bộ dấu thanh
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/₂/g, "2") // CO₂ → CO2
    .replace(/[–—]/g, "-"); // gạch ngang dài về gạch thường
}

/** Định dạng số kiểu vi-VN, tự chọn số chữ số thập phân theo độ lớn. */
function fmtNum(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const digits = Math.abs(v) >= 1000 ? 0 : 2;
  return v.toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/* ────────────────────────────────
   2. XUẤT EXCEL (.xlsx)
   ──────────────────────────────── */

/**
 * Xuất nhiều bảng dữ liệu thành một workbook .xlsx, mỗi bảng là một sheet.
 *
 * @param {object} options
 * @param {string} options.fileName     – tên tệp (không cần đuôi)
 * @param {Array<{name: string, rows: any[][]}>} options.sheets – danh sách sheet
 * @returns {Promise<string>} tên tệp đã tải
 */
export async function exportToExcel({ fileName, sheets }) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Tự chỉnh độ rộng cột theo nội dung dài nhất (tối đa 42 ký tự).
    const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
    ws["!cols"] = Array.from({ length: colCount }, (_, c) => ({
      wch: Math.min(
        42,
        Math.max(12, ...rows.map((r) => String(r[c] ?? "").length + 2)),
      ),
    }));
    // Sheet name của Excel tối đa 31 ký tự và cấm một số ký tự đặc biệt.
    const safeName = String(name).replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  const full = `${fileName}_${stamp()}`;
  XLSX.writeFile(wb, `${full}.xlsx`);
  return `${full}.xlsx`;
}

/**
 * Tạo dữ liệu Excel cho bảng chỉ số ESG (3 trụ cột E / S / G).
 *
 * @param {object} params
 * @param {object} params.matrix       – ma trận chỉ số { e: [], s: [], g: [] }
 * @param {string} params.periodLabel  – nhãn kỳ báo cáo, ví dụ "Quý 4/2025"
 * @param {Array}  params.pillars      – định nghĩa trụ cột [{id, letter, name}]
 * @returns {Array<{name: string, rows: any[][]}>}
 */
export function buildEsgSheets({ matrix, periodLabel, pillars }) {
  const header = [
    "Chỉ số",
    "Đơn vị",
    "Giá trị kỳ này",
    "Kỳ trước",
    "Mục tiêu",
    "Chênh lệch",
    "Trạng thái tuân thủ",
    "Bộ phận phụ trách",
  ];

  const sheets = pillars.map((p) => ({
    name: `${p.letter} - ${p.name}`,
    rows: [
      [`Chỉ số ${p.letter} – ${p.name} (${p.sub})`, ...Array(header.length - 1).fill("")],
      [`Kỳ báo cáo: ${periodLabel}`],
      [],
      header,
      ...matrix[p.id].map((i) => [
        i.label,
        i.unit,
        i.value,
        i.prev,
        i.target,
        Number((i.value - i.prev).toFixed(3)),
        i.compliance,
        i.owner,
      ]),
    ],
  }));

  // Sheet tổng hợp: đếm chỉ số theo trạng thái tuân thủ.
  const all = pillars.flatMap((p) => matrix[p.id]);
  const count = (c) => all.filter((i) => i.compliance === c).length;
  sheets.push({
    name: "Tong hop",
    rows: [
      ["TỔNG HỢP CHỈ SỐ ESG"],
      [`Kỳ báo cáo: ${periodLabel}`],
      [],
      ["Trạng thái tuân thủ", "Số chỉ số"],
      ["Tuân thủ", count("compliant")],
      ["Tuân thủ một phần", count("partial")],
      ["Chưa đạt", count("gap")],
      [],
      ["Tổng số chỉ số", all.length],
      ["Tỷ lệ tuân thủ đầy đủ (%)", all.length ? Math.round((count("compliant") / all.length) * 100) : 0],
    ],
  });

  return sheets;
}

/**
 * Tạo dữ liệu Excel cho bảng Scope 1/2/3 (trang Phát thải Carbon).
 *
 * @param {object} params
 * @param {Array}  params.scopes       – [{id, name, subtitle, hint}]
 * @param {object} params.scopeData    – { scope1: {value, prev, target}, ... }
 * @param {string} params.periodLabel
 * @param {Array}  params.sites        – [{id, name, kind, region}]
 * @param {object} params.siteMatrix   – { [siteId]: { scope1, scope2, scope3 } }
 * @returns {Array<{name: string, rows: any[][]}>}
 */
export function buildCarbonSheets({ scopes, scopeData, periodLabel, sites, siteMatrix }) {
  const totalActual = scopes.reduce((s, x) => s + scopeData[x.id].value, 0);
  const totalTarget = scopes.reduce((s, x) => s + scopeData[x.id].target, 0);

  const summaryRows = [
    ["KIỂM KÊ KHÍ NHÀ KÍNH THEO GHG PROTOCOL"],
    [`Kỳ báo cáo: ${periodLabel}`],
    [],
    ["Scope", "Loại", "Mô tả", "Kỳ này (tấn CO2e)", "Kỳ trước", "Hạn mức", "Chênh lệch", "Tỷ lệ so hạn mức (%)"],
    ...scopes.map((s) => {
      const d = scopeData[s.id];
      return [
        s.name,
        s.subtitle,
        s.hint,
        d.value,
        d.prev,
        d.target,
        Number((d.value - d.prev).toFixed(3)),
        d.target ? Number(((d.value / d.target) * 100).toFixed(1)) : 0,
      ];
    }),
    [],
    ["Tổng phát thải kỳ này (tấn CO2e)", Number(totalActual.toFixed(3))],
    ["Tổng hạn mức (tấn CO2e)", Number(totalTarget.toFixed(3))],
    [
      totalActual > totalTarget ? "Vượt hạn mức (tấn)" : "Dưới hạn mức (tấn)",
      Number(Math.abs(totalActual - totalTarget).toFixed(3)),
    ],
  ];

  const detailRows = [
    ["PHÂN BỔ PHÁT THẢI THEO NHÀ XƯỞNG / CHI NHÁNH"],
    [`Kỳ báo cáo: ${periodLabel}`],
    [],
    ["Nhà xưởng / Chi nhánh", "Loại", "Khu vực", ...scopes.map((s) => `${s.name} (tấn)`), "Tổng (tấn CO2e)"],
    ...sites.map((site) => {
      const row = siteMatrix[site.id] ?? {};
      const vals = scopes.map((s) => Number((row[s.id] ?? 0).toFixed(3)));
      const total = vals.reduce((a, b) => a + b, 0);
      return [site.name, site.kind, site.region, ...vals, Number(total.toFixed(3))];
    }),
  ];

  return [
    { name: "Tong hop Scope", rows: summaryRows },
    { name: "Phan bo theo co so", rows: detailRows },
  ];
}

/* ────────────────────────────────
   3. XUẤT PDF (jspdf)
   ──────────────────────────────── */

/**
 * Vẽ một bảng vào PDF và tự động sang trang khi hết chỗ.
 * Trả về toạ độ Y mới sau khi vẽ xong.
 */
function drawTable(doc, { startY, margin, columns, rows, pageWidth, pageHeight, accent }) {
  const rowH = 7.2;
  const bottom = pageHeight - margin - 12;
  let y = startY;

  const drawHeader = () => {
    doc.setFillColor(...accent);
    doc.rect(margin, y, pageWidth - margin * 2, rowH + 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.4);
    let x = margin + 2;
    columns.forEach((c) => {
      doc.text(deaccent(c.label), x, y + 5.4);
      x += c.w;
    });
    y += rowH + 1;
  };

  drawHeader();

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);

  rows.forEach((row, idx) => {
    if (y > bottom) {
      doc.addPage();
      y = margin;
      drawHeader();
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
    }
    // Kẻ nền xen kẽ để dễ đọc dòng.
    if (idx % 2 === 1) {
      doc.setFillColor(246, 249, 252);
      doc.rect(margin, y, pageWidth - margin * 2, rowH, "F");
    }
    let x = margin + 2;
    columns.forEach((c, ci) => {
      const raw = String(row[ci] ?? "");
      // Cắt bớt nếu quá dài so với bề rộng cột (ước lượng theo cỡ chữ 8).
      const maxChars = Math.floor(c.w / 1.75);
      const text = raw.length > maxChars ? `${raw.slice(0, maxChars - 1)}…` : raw;
      if (text) doc.text(deaccent(text), x, y + 5);
      x += c.w;
    });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);
    y += rowH;
  });

  return y;
}

/** Vẽ tiêu đề trang đầu của báo cáo PDF. */
function drawCover(doc, { margin, pageWidth, title, subtitle, metaLines, accent }) {
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(deaccent(title), margin, 15);
  doc.setFontSize(9);
  doc.text(deaccent(subtitle), margin, 23);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  let y = 46;
  metaLines.forEach((line) => {
    doc.text(deaccent(line), margin, y);
    y += 5.4;
  });
  return y + 4;
}

/**
 * Xuất báo cáo PDF gồm nhiều bảng chỉ số.
 *
 * @param {object} options
 * @param {string} options.fileName
 * @param {string} options.title
 * @param {string} options.subtitle
 * @param {string[]} options.meta        – các dòng thông tin ở đầu báo cáo
 * @param {Array<{heading: string, columns: {label, w}[], rows: any[][]}>} options.tables
 * @returns {Promise<string>} tên tệp đã tải
 */
export async function exportToPdf({ fileName, title, subtitle, meta = [], tables = [] }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const accent = [16, 185, 129]; // emerald EcoMetric

  let y = drawCover(doc, { margin, pageWidth, title, subtitle, metaLines: meta, accent });

  tables.forEach(({ heading, columns, rows }) => {
    // Nếu gần cuối trang thì sang trang mới trước khi vẽ bảng.
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin + 4;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.text(deaccent(heading), margin, y);
    y += 4;

    y = drawTable(doc, {
      startY: y,
      margin,
      columns,
      rows,
      pageWidth,
      pageHeight,
      accent,
    });
    y += 10; // khoảng cách giữa các bảng
  });

  // Đánh số trang ở chân mỗi trang.
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `EcoMetric · Trang ${i}/${pages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: "right" },
    );
  }

  const full = `${fileName}_${stamp()}`;
  doc.save(`${full}.pdf`);
  return `${full}.pdf`;
}

/**
 * Dựng nội dung báo cáo PDF cho bảng chỉ số ESG.
 */
export function buildEsgPdfTables({ matrix, pillars }) {
  const header = [
    { label: "Chỉ số", w: 62 },
    { label: "Đơn vị", w: 22 },
    { label: "Kỳ này", w: 20 },
    { label: "Kỳ trước", w: 20 },
    { label: "Mục tiêu", w: 20 },
    { label: "Trạng thái", w: 26 },
  ];

  return pillars.map((p) => ({
    heading: `Chỉ số ${p.letter} - ${p.name} (${p.sub})`,
    columns: header,
    rows: matrix[p.id].map((i) => [
      i.label,
      i.unit,
      fmtNum(i.value),
      fmtNum(i.prev),
      fmtNum(i.target),
      i.compliance,
    ]),
  }));
}

/**
 * Dựng nội dung báo cáo PDF cho bảng Scope 1/2/3.
 */
export function buildCarbonPdfTables({ scopes, scopeData, sites, siteMatrix }) {
  const scopeCols = [
    { label: "Scope", w: 34 },
    { label: "Kỳ này (tấn)", w: 32 },
    { label: "Kỳ trước", w: 28 },
    { label: "Hạn mức", w: 26 },
    { label: "Chênh lệch", w: 26 },
    { label: "% hạn mức", w: 24 },
  ];

  const siteCols = [
    { label: "Nhà xưởng / Chi nhánh", w: 58 },
    ...scopes.map((s) => ({ label: s.name, w: 24 })),
    { label: "Tổng", w: 24 },
  ];

  return [
    {
      heading: "Tổng hợp phát thải theo Scope 1 / 2 / 3",
      columns: scopeCols,
      rows: scopes.map((s) => {
        const d = scopeData[s.id];
        return [
          `${s.name} - ${s.subtitle}`,
          fmtNum(d.value),
          fmtNum(d.prev),
          fmtNum(d.target),
          fmtNum(d.value - d.prev),
          d.target ? `${((d.value / d.target) * 100).toFixed(1)}%` : "—",
        ];
      }),
    },
    {
      heading: "Phân bổ phát thải theo nhà xưởng / chi nhánh",
      columns: siteCols,
      rows: sites.map((site) => {
        const row = siteMatrix[site.id] ?? {};
        const vals = scopes.map((s) => row[s.id] ?? 0);
        const total = vals.reduce((a, b) => a + b, 0);
        return [site.name, ...vals.map(fmtNum), fmtNum(total)];
      }),
    },
  ];
}
