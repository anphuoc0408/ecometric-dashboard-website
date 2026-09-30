/**
 * EcoMetric – Màn hình 6: Cài đặt
 * Phong cách: Apple "iOS Liquid Glass" (glass / glass-press từ index.css)
 *
 * Stack: React + Tailwind CSS v4 + lucide-react
 * Gồm 4 khối chính:
 *   1. Thẻ thông tin doanh nghiệp & nhà xưởng (tên, mã ngành, địa điểm, diện tích)
 *   2. Cấu hình hệ số phát thải (Điện lưới, Dầu Diesel, Xăng, Nước, Rác thải)
 *   3. Cấu hình cảnh báo & ngưỡng (cảnh báo khi vượt % so với trung bình)
 *   4. Phân quyền & quản lý người dùng (Admin, Auditor, Factory Manager)
 */
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  CircleSlash,
  Droplets,
  Factory,
  Flame,
  Fuel,
  Gauge,
  Hash,
  Landmark,
  Leaf,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserCog,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

/* ────────────────────────────────
   1. DESIGN TOKENS (kế thừa bảng màu của Dashboard, Phát thải carbon, Khuyến nghị AI & Báo cáo ESG)
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
const LABEL = "flex items-center gap-[6px] text-[12px] font-semibold text-[#64748b]";

// Ô nhập liệu kiểu iOS: kính mỏng, bo tròn, focus viền emerald
const FIELD =
  "w-full rounded-[12px] border-white/70 bg-white/60 px-3 py-[10px] text-[13px] text-[#0f172a] " +
  "placeholder:text-[#94a3b8] outline-none backdrop-blur-[12px] transition-shadow " +
  "focus:border-[#10b981]/60 focus:bg-white/85 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]";

// Nút hành động chính (kính xanh đặc) & nút phụ (kính trong)
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#10b981] px-4 py-[10px] " +
  `text-[13px] font-semibold text-white transition-all hover:bg-[#0ea371] active:scale-[0.98] ${FOCUS}`;
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-4 py-[10px] " +
  `text-[13px] font-semibold text-[#0f172a] backdrop-blur-[12px] transition-all hover:bg-white active:scale-[0.98] ${FOCUS}`;

/* ────────────────────────────────
   2. DỮ LIỆU MẪU (thay bằng API sau này)
   ──────────────────────────────── */

/* — Thông tin doanh nghiệp — */
const COMPANY = {
  name: "Công ty Cổ phần Dệt may EcoMetric",
  taxCode: "3702 456 789",
  industryCode: "1310 – Sản xuất vải dệt thoi",
  industryGroup: "Dệt may – May mặc (VSIC 1310)",
  address: "Lô C4, KCN Tân Đông Hiệp B, TP. Thuận An, Bình Dương",
  founded: "2011",
  employees: "1.248 lao động",
  certifications: ["ISO 14001:2015", "ISO 50001:2018", "OEKO-TEX Standard 100"],
};

/* — Danh sách nhà xưởng / địa điểm — */
const SITES = [
  {
    id: "a",
    name: "Nhà máy A – Dệt nhuộm",
    kind: "Nhà xưởng",
    location: "KCN Tân Đông Hiệp B, Bình Dương",
    area: 24_500,
    icon: Factory,
    color: COLOR.emerald,
  },
  {
    id: "b",
    name: "Nhà máy B – May mặc",
    kind: "Nhà xưởng",
    location: "KCN Long Thành, Đồng Nai",
    area: 18_200,
    icon: Factory,
    color: COLOR.blue,
  },
  {
    id: "c",
    name: "Nhà máy C – Xử lý nước",
    kind: "Nhà xưởng",
    location: "KCN Tân Tạo, Long An",
    area: 9_800,
    icon: Factory,
    color: COLOR.violet,
  },
  {
    id: "d",
    name: "Kho trung tâm – Logistics",
    kind: "Chi nhánh",
    location: "Quận 12, TP. Hồ Chí Minh",
    area: 12_400,
    icon: Building2,
    color: COLOR.amber,
  },
];

/* — Hệ số phát thải mặc định (nguồn tham chiếu để đối chiếu) —
     ef     : hệ số hiện đang áp dụng trong hệ thống
     ref    : giá trị tham chiếu tiêu chuẩn (không sửa được)
     unit   : đơn vị của hệ số
     basis  : nguồn / cơ sở pháp lý                        */
const EMISSION_FACTORS = [
  {
    id: "grid",
    name: "Điện lưới quốc gia",
    desc: "Hệ số phát thải biên của lưới điện Việt Nam, áp dụng cho toàn bộ điện mua ngoài (Scope 2).",
    ef: 0.6592,
    ref: 0.6766,
    unit: "kgCO2e/kWh",
    basis: "Bộ TN&MT · Thông tư 01/2025",
    scope: "Scope 2",
    icon: Zap,
    color: COLOR.emerald,
    step: 0.0001,
  },
  {
    id: "diesel",
    name: "Dầu Diesel (DO)",
    desc: "Hệ số đốt cháy dầu DO cho lò hơi, máy phát và thiết bị gia nhiệt tại nhà xưởng (Scope 1).",
    ef: 2.6742,
    ref: 2.6742,
    unit: "kgCO2e/lít",
    basis: "IPCC 2006 · Hướng dẫn 2019",
    scope: "Scope 1",
    icon: Flame,
    color: COLOR.amber,
    step: 0.0001,
  },
  {
    id: "gasoline",
    name: "Xăng (RON 95)",
    desc: "Hệ số đốt cháy xăng cho đội xe nâng, xe tải nhẹ và phương tiện nội bộ (Scope 1).",
    ef: 2.3120,
    ref: 2.3120,
    unit: "kgCO2e/lít",
    basis: "IPCC 2006 · Hướng dẫn 2019",
    scope: "Scope 1",
    icon: Fuel,
    color: COLOR.red,
    step: 0.0001,
  },
  {
    id: "water",
    name: "Nước cấp",
    desc: "Hệ số phát thải từ khai thác, bơm và xử lý nước cấp cho sản xuất và sinh hoạt (Scope 3).",
    ef: 0.3410,
    ref: 0.3440,
    unit: "kgCO2e/m³",
    basis: "Bộ TN&MT · Thông tư 01/2025",
    scope: "Scope 3",
    icon: Droplets,
    color: COLOR.blue,
    step: 0.0001,
  },
  {
    id: "waste",
    name: "Rác thải / Chất thải rắn",
    desc: "Hệ số phát thải khi chôn lấp và xử lý chất thải rắn công nghiệp, phụ phẩm dệt may (Scope 3).",
    ef: 0.5820,
    ref: 0.6100,
    unit: "kgCO2e/kg",
    basis: "IPCC 2006 · Mô hình FOD",
    scope: "Scope 3",
    icon: Trash2,
    color: COLOR.violet,
    step: 0.0001,
  },
];

/* — Ngưỡng cảnh báo theo loại tài nguyên (% vượt so với trung bình) — */
const THRESHOLDS = [
  { id: "electricity", name: "Điện năng", unit: "kWh", warn: 10, critical: 20, icon: Zap, color: COLOR.emerald, enabled: true },
  { id: "water", name: "Nước", unit: "m³", warn: 12, critical: 25, icon: Droplets, color: COLOR.blue, enabled: true },
  { id: "fuel", name: "Nhiên liệu", unit: "Lít", warn: 8, critical: 15, icon: Flame, color: COLOR.amber, enabled: true },
  { id: "material", name: "Nguyên liệu", unit: "kg", warn: 15, critical: 30, icon: Leaf, color: COLOR.violet, enabled: false },
  { id: "waste", name: "Rác thải", unit: "kg", warn: 10, critical: 22, icon: Trash2, color: COLOR.red, enabled: true },
];

/* — Kênh nhận cảnh báo — */
const ALERT_CHANNELS = [
  { id: "email", label: "Email quản lý", desc: "Gửi tới nhóm Quản trị viên & Trưởng nhà xưởng", icon: Mail, enabled: true },
  { id: "dashboard", label: "Cảnh báo trên Dashboard", desc: "Hiển thị thẻ cảnh báo ở trang Tổng quan", icon: Gauge, enabled: true },
  { id: "auto", label: "Tự động tạm dừng nhập liệu", desc: "Khoá form nhập khi vượt ngưỡng nghiêm trọng", icon: Lock, enabled: false },
];

/* — Vai trò & quyền hạn — */
const ROLES = {
  admin: {
    label: "Admin",
    desc: "Toàn quyền hệ thống, cấu hình hệ số & phân quyền",
    bg: "bg-[#10b981]/14",
    text: "text-[#059669]",
    color: COLOR.emerald,
    icon: ShieldCheck,
  },
  manager: {
    label: "Factory Manager",
    desc: "Nhập liệu, xem báo cáo và khuyến nghị của nhà xưởng phụ trách",
    bg: "bg-[#dbeafe]",
    text: "text-[#1d4ed8]",
    color: COLOR.blue,
    icon: Factory,
  },
  auditor: {
    label: "Auditor",
    desc: "Chỉ đọc và kiểm chứng số liệu, xuất hồ sơ kiểm toán",
    bg: "bg-[#fef3c7]",
    text: "text-[#b45309]",
    color: COLOR.amber,
    icon: BadgeCheck,
  },
};

/* — Danh sách tài khoản — */
const USERS = [
  {
    id: "u1",
    name: "Nguyễn Văn A",
    email: "a.nguyen@ecometric.vn",
    role: "admin",
    site: "Toàn hệ thống",
    status: "active",
    lastActive: "Hôm nay · 08:24",
    initials: "NA",
    color: COLOR.emerald,
  },
  {
    id: "u2",
    name: "Trần Thị Bích",
    email: "b.tran@ecometric.vn",
    role: "manager",
    site: "Nhà máy A – Dệt nhuộm",
    status: "active",
    lastActive: "Hôm nay · 07:10",
    initials: "TB",
    color: COLOR.blue,
  },
  {
    id: "u3",
    name: "Lê Minh Cường",
    email: "c.le@ecometric.vn",
    role: "manager",
    site: "Nhà máy B – May mặc",
    status: "active",
    lastActive: "Hôm qua · 17:42",
    initials: "LC",
    color: COLOR.violet,
  },
  {
    id: "u4",
    name: "Phạm Thu Hà",
    email: "h.pham@audit-partner.vn",
    role: "auditor",
    site: "Toàn hệ thống",
    status: "active",
    lastActive: "3 ngày trước",
    initials: "PH",
    color: COLOR.amber,
  },
  {
    id: "u5",
    name: "Võ Quốc Dũng",
    email: "d.vo@ecometric.vn",
    role: "manager",
    site: "Nhà máy C – Xử lý nước",
    status: "invited",
    lastActive: "Chưa đăng nhập",
    initials: "VD",
    color: COLOR.red,
  },
  {
    id: "u6",
    name: "Đặng Hoài Nam",
    email: "n.dang@ecometric.vn",
    role: "manager",
    site: "Kho trung tâm – Logistics",
    status: "suspended",
    lastActive: "2 tháng trước",
    initials: "DN",
    color: COLOR.slate,
  },
];

const USER_STATUS = {
  active: { label: "Đang hoạt động", bg: "bg-[#10b981]/14", text: "text-[#059669]", icon: BadgeCheck },
  invited: { label: "Đã mời", bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", icon: Mail },
  suspended: { label: "Tạm khoá", bg: "bg-[#fee2e2]", text: "text-[#991b1b]", icon: CircleSlash },
};

/* ────────────────────────────────
   3. HÀM TIỆN ÍCH
   ──────────────────────────────── */
const fmt = (n, digits = 1) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const fmtInt = (n) => n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

// So hệ số hiện tại với giá trị tham chiếu → mức lệch (%)
const factorDelta = (ef, ref) => ((ef - ref) / ref) * 100;

/* ────────────────────────────────
   4. THÀNH PHẦN GIAO DIỄN
   ──────────────────────────────── */

/* ── Thẻ thông tin doanh nghiệp ──────────────────────────────── */
function CompanyCard({ company, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(company);

  const set = (key) => (e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    setEditing(false);
    onSaved("Thông tin doanh nghiệp đã được lưu");
    // TODO: gọi API cập nhật thông tin doanh nghiệp tại đây
  };

  return (
    <form onSubmit={save} className={`${GLASS} flex flex-col gap-5 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#10b981]/14">
            <Building2 size={19} strokeWidth={2.2} color={COLOR.emeraldDark} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-bold text-[#0f172a]">Thông tin doanh nghiệp &amp; Nhà xưởng</h2>
            <p className="text-[12px] text-[#64748b]">
              Dùng để quy đổi phát thải, phân bổ dữ liệu và lập hồ sơ công bố
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(company);
                  setEditing(false);
                }}
                className={BTN_GHOST}
              >
                Huỷ
              </button>
              <button type="submit" className={BTN_PRIMARY}>
                <Save size={15} strokeWidth={2.6} />
                Lưu thay đổi
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className={BTN_PRIMARY}>
              <Pencil size={15} strokeWidth={2.6} />
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Trường thông tin */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-[6px]">
          <span className={LABEL}>
            <Building2 size={13} strokeWidth={2.4} /> Tên công ty
          </span>
          <input
            type="text"
            value={draft.name}
            onChange={set("name")}
            readOnly={!editing}
            className={`${FIELD} ${!editing ? "cursor-default border-transparent bg-white/40" : ""}`}
          />
        </label>

        <label className="flex flex-col gap-[6px]">
          <span className={LABEL}>
            <Hash size={13} strokeWidth={2.4} /> Mã số thuế
          </span>
          <input
            type="text"
            value={draft.taxCode}
            onChange={set("taxCode")}
            readOnly={!editing}
            className={`${FIELD} ${!editing ? "cursor-default border-transparent bg-white/40" : ""}`}
          />
        </label>

        <label className="flex flex-col gap-[6px]">
          <span className={LABEL}>
            <Landmark size={13} strokeWidth={2.4} /> Mã ngành (VSIC)
          </span>
          <input
            type="text"
            value={draft.industryCode}
            onChange={set("industryCode")}
            readOnly={!editing}
            className={`${FIELD} ${!editing ? "cursor-default border-transparent bg-white/40" : ""}`}
          />
        </label>

        <label className="flex flex-col gap-[6px] md:col-span-2">
          <span className={LABEL}>
            <MapPin size={13} strokeWidth={2.4} /> Địa điểm trụ sở
          </span>
          <input
            type="text"
            value={draft.address}
            onChange={set("address")}
            readOnly={!editing}
            className={`${FIELD} ${!editing ? "cursor-default border-transparent bg-white/40" : ""}`}
          />
        </label>

        <label className="flex flex-col gap-[6px]">
          <span className={LABEL}>
            <Hash size={13} strokeWidth={2.4} /> Năm thành lập
          </span>
          <input
            type="text"
            value={draft.founded}
            onChange={set("founded")}
            readOnly={!editing}
            className={`${FIELD} ${!editing ? "cursor-default border-transparent bg-white/40" : ""}`}
          />
        </label>
      </div>

      {/* Chứng nhận đang áp dụng */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/60 pt-4">
        <span className={`${LABEL} mr-1`}>
          <BadgeCheck size={13} strokeWidth={2.4} /> Chứng nhận đang áp dụng
        </span>
        {company.certifications.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-[6px] rounded-full bg-[#10b981]/12 px-[12px] py-[5px] text-[11px] font-semibold text-[#059669]"
          >
            <Check size={12} strokeWidth={2.8} />
            {c}
          </span>
        ))}
        <span className="text-[11px] text-[#94a3b8]">· {company.employees}</span>
      </div>
    </form>
  );
}

/* ── Bảng nhà xưởng / địa điểm ──────────────────────────────── */
function SitesCard() {
  const totalArea = useMemo(() => SITES.reduce((s, x) => s + x.area, 0), []);

  return (
    <section className={`${GLASS} flex flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#10b981]/14">
            <Factory size={19} strokeWidth={2.2} color={COLOR.emeraldDark} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-bold text-[#0f172a]">Danh sách nhà xưởng &amp; địa điểm</h2>
            <p className="text-[12px] text-[#64748b]">
              {SITES.length} địa điểm · Tổng diện tích{" "}
              <b className="text-[#0f172a]">{fmtInt(totalArea)} m²</b>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={LABEL}>
            <Ruler size={13} strokeWidth={2.4} /> Tổng diện tích
            <b className="ml-1 text-[13px] text-[#0f172a]">{(totalArea / 10_000).toFixed(1)} ha</b>
          </span>
          <button type="button" className={BTN_GHOST}>
            <Plus size={15} strokeWidth={2.6} />
            Thêm địa điểm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SITES.map(({ id, name, kind, location, area, icon: Icon, color }) => (
          <article
            key={id}
            className="glass-press relative flex flex-col gap-3 overflow-hidden rounded-[18px] border border-white/70 bg-white/50 p-4"
          >
            <span className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: color }} />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ backgroundColor: `${color}1f` }}
                >
                  <Icon size={17} strokeWidth={2.2} color={color} />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[13px] font-bold text-[#0f172a]">{name}</span>
                  <span className="text-[11px] text-[#94a3b8]">{kind}</span>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Chỉnh sửa ${name}`}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/70 text-[#64748b] transition-all hover:bg-white hover:text-[#0f172a] ${FOCUS}`}
              >
                <Pencil size={14} strokeWidth={2.4} />
              </button>
            </div>

            <div className="flex items-start gap-2 text-[12px] text-[#64748b]">
              <MapPin size={13} strokeWidth={2.4} color={COLOR.muted} className="mt-[2px] shrink-0" />
              {location}
            </div>

            <div className="flex items-end justify-between gap-3 border-t border-white/60 pt-3">
              <span className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-[#94a3b8]">Diện tích</span>
                <span className="text-[15px] font-extrabold text-[#0f172a]">
                  {fmtInt(area)} <span className="text-[11px] font-semibold text-[#64748b]">m²</span>
                </span>
              </span>
              <span className="text-[11px] text-[#94a3b8]">
                {((area / totalArea) * 100).toFixed(1)}% tổng diện tích
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── Cấu hình hệ số phát thải ────────────────────────────────── */
function EmissionFactorsCard({ onSaved }) {
  const [factors, setFactors] = useState(EMISSION_FACTORS);
  const [dirty, setDirty] = useState(false);

  const update = (id, value) => {
    const num = value === "" ? 0 : Math.max(0, Number(value));
    setFactors((prev) => prev.map((f) => (f.id === id ? { ...f, ef: num } : f)));
    setDirty(true);
  };

  const resetAll = () => {
    setFactors(EMISSION_FACTORS);
    setDirty(false);
  };

  const save = () => {
    setDirty(false);
    onSaved(`Đã lưu ${factors.length} hệ số phát thải`);
    // TODO: gọi API lưu hệ số phát thải tại đây
  };

  const changedCount = factors.filter((f) => Math.abs(f.ef - f.ref) > 0.00005).length;

  return (
    <section className={`${GLASS} flex flex-col gap-5 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#10b981]/14">
            <Gauge size={19} strokeWidth={2.2} color={COLOR.emeraldDark} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-bold text-[#0f172a]">Cấu hình hệ số phát thải</h2>
            <p className="text-[12px] text-[#64748b]">
              Tùy chỉnh hệ số quy đổi CO2e · áp dụng cho mọi bản ghi nhập liệu mới
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-[6px] rounded-full px-[12px] py-[6px] text-[12px] font-semibold ${
              changedCount > 0 ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#10b981]/14 text-[#059669]"
            }`}
          >
            {changedCount > 0 ? <TriangleAlert size={13} strokeWidth={2.6} /> : <Check size={13} strokeWidth={2.8} />}
            {changedCount > 0 ? `${changedCount} hệ số khác tham chiếu` : "Khớp tham chiếu"}
          </span>
          <button type="button" onClick={resetAll} className={BTN_GHOST}>
            Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className={`${BTN_PRIMARY} disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#10b981]`}
          >
            <Save size={15} strokeWidth={2.6} />
            Lưu cấu hình
          </button>
        </div>
      </div>

      {/* Danh sách hệ số */}
      <ul className="flex flex-col gap-3">
        {factors.map(({ id, name, desc, ef, ref, unit, basis, scope, icon: Icon, color, step }) => {
          const delta = factorDelta(ef, ref);
          const changed = Math.abs(delta) > 0.05;

          return (
            <li
              key={id}
              className="flex flex-col gap-4 rounded-[18px] border border-white/70 bg-white/50 p-4 xl:flex-row xl:items-center"
            >
              {/* Nhận diện */}
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: `${color}1f` }}
                >
                  <Icon size={18} strokeWidth={2.2} color={color} />
                </span>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-[#0f172a]">{name}</span>
                    <span
                      className="rounded-full px-[9px] py-[3px] text-[10px] font-semibold"
                      style={{ backgroundColor: `${color}1f`, color }}
                    >
                      {scope}
                    </span>
                  </div>
                  <p className="text-[11px] leading-[1.5] text-[#64748b]">{desc}</p>
                  <span className="text-[11px] text-[#94a3b8]">Cơ sở: {basis}</span>
                </div>
              </div>

              {/* Ô nhập hệ số */}
              <div className="flex shrink-0 flex-wrap items-end gap-3">
                <label className="flex flex-col gap-[5px]">
                  <span className={LABEL}>Hệ số áp dụng</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step={step}
                      value={ef}
                      onChange={(e) => update(id, e.target.value)}
                      className={`${FIELD} w-[130px] text-right font-semibold`}
                    />
                    <span className="w-[110px] text-[11px] font-semibold text-[#64748b]">{unit}</span>
                  </span>
                </label>

                <div className="flex flex-col gap-[5px]">
                  <span className={LABEL}>Tham chiếu</span>
                  <span className="flex h-[41px] items-center gap-2 rounded-[12px] border border-transparent bg-white/40 px-3">
                    <span className="w-[130px] text-right text-[13px] font-semibold text-[#94a3b8]">
                      {fmt(ref, 4)}
                    </span>
                    <span className="w-[110px] text-[11px] text-[#94a3b8]">{unit}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-[5px]">
                  <span className={LABEL}>Lệch</span>
                  <span
                    className={`flex h-[41px] w-[92px] items-center justify-center rounded-[12px] text-[12px] font-bold ${
                      changed ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#10b981]/12 text-[#059669]"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {fmt(delta, 2)}%
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-white/60 pt-4 text-[11px] leading-[1.5] text-[#94a3b8]">
        Lưu ý: thay đổi hệ số chỉ áp dụng cho dữ liệu nhập mới, không tự tính lại các bản ghi và báo cáo đã công bố.
      </p>
    </section>
  );
}

/* ── Cấu hình cảnh báo & ngưỡng ──────────────────────────────── */
function ThresholdsCard({ onSaved }) {
  const [rows, setRows] = useState(THRESHOLDS);
  const [channels, setChannels] = useState(ALERT_CHANNELS);

  const updateRow = (id, key, value) => {
    const num = value === "" ? 0 : Math.max(0, Number(value));
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: num } : r)));
  };

  const toggleRow = (id) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  const toggleChannel = (id) =>
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));

  const enabledCount = rows.filter((r) => r.enabled).length;

  return (
    <section className={`${GLASS} flex flex-col gap-5 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#fef3c7]">
            <TriangleAlert size={19} strokeWidth={2.2} color="#b45309" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-bold text-[#0f172a]">Cảnh báo &amp; Ngưỡng</h2>
            <p className="text-[12px] text-[#64748b]">
              Cảnh báo khi mức tiêu thụ vượt % so với trung bình 30 ngày gần nhất
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onSaved("Đã lưu cấu hình cảnh báo & ngưỡng");
            // TODO: gọi API lưu ngưỡng cảnh báo tại đây
          }}
          className={BTN_PRIMARY}
        >
          <Save size={15} strokeWidth={2.6} />
          Lưu ngưỡng
        </button>
      </div>

      {/* Ngưỡng theo loại tài nguyên */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="flex items-center gap-3 rounded-t-[14px] border border-white/60 bg-white/55 px-4 py-[10px] text-[12px] font-semibold text-[#64748b] backdrop-blur-[12px]">
            <span className="min-w-[180px] flex-1">Loại tài nguyên</span>
            <span className="w-[180px] shrink-0">Ngưỡng cảnh báo</span>
            <span className="w-[180px] shrink-0">Ngưỡng nghiêm trọng</span>
            <span className="w-[120px] shrink-0 text-center">Kích hoạt</span>
          </div>

          {rows.map(({ id, name, unit, warn, critical, icon: Icon, color, enabled }, idx) => (
            <div
              key={id}
              className={`flex items-center gap-3 border-x border-b border-white/60 px-4 py-[12px] transition-colors hover:bg-white/70 ${
                idx === rows.length - 1 ? "rounded-b-[14px]" : ""
              } ${enabled ? "" : "opacity-55"}`}
            >
              <div className="flex min-w-[180px] flex-1 items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: `${color}1f` }}
                >
                  <Icon size={15} strokeWidth={2.2} color={color} />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[13px] font-semibold text-[#0f172a]">{name}</span>
                  <span className="text-[11px] text-[#94a3b8]">Đơn vị: {unit}</span>
                </div>
              </div>

              <label className="flex w-[180px] shrink-0 items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={warn}
                  disabled={!enabled}
                  onChange={(e) => updateRow(id, "warn", e.target.value)}
                  className={`${FIELD} w-[100px] text-right font-semibold disabled:cursor-not-allowed`}
                />
                <span className="text-[11px] font-semibold text-[#64748b]">% vượt</span>
              </label>

              <label className="flex w-[180px] shrink-0 items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={critical}
                  disabled={!enabled}
                  onChange={(e) => updateRow(id, "critical", e.target.value)}
                  className={`${FIELD} w-[100px] text-right font-semibold disabled:cursor-not-allowed`}
                />
                <span className="text-[11px] font-semibold text-[#64748b]">% vượt</span>
              </label>

              {/* Công tắc kiểu iOS */}
              <div className="flex w-[120px] shrink-0 justify-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`Bật cảnh báo cho ${name}`}
                  onClick={() => toggleRow(id)}
                  className={`relative h-[26px] w-[46px] shrink-0 rounded-full border transition-all ${FOCUS} ${
                    enabled ? "border-transparent bg-[#10b981]" : "border-white/70 bg-white/60"
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-[20px] w-[20px] -translate-y-1/2 rounded-full bg-white shadow-[0_2px_5px_rgba(15,23,42,0.28)] transition-all ${
                      enabled ? "left-[23px]" : "left-[3px]"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ví dụ minh hoạ ngưỡng */}
      <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-white/55 px-4 py-4">
        <span className={LABEL}>
          <Gauge size={13} strokeWidth={2.4} /> Ví dụ với Điện năng
        </span>
        <span className="text-[12px] text-[#64748b]">
          Trung bình 30 ngày: <b className="text-[#0f172a]">14.200 kWh/ngày</b> → cảnh báo khi vượt{" "}
          <b className="text-[#b45309]">{fmtInt(14_200 * (1 + rows[0].warn / 100))} kWh</b> (tăng {rows[0].warn}%), nghiêm
          trọng khi vượt <b className="text-[#991b1b]">{fmtInt(14_200 * (1 + rows[0].critical / 100))} kWh</b> (tăng{" "}
          {rows[0].critical}%)
        </span>
        <span className="ml-auto text-[11px] text-[#94a3b8]">{enabledCount}/{rows.length} loại đang bật cảnh báo</span>
      </div>

      {/* Kênh nhận cảnh báo */}
      <div className="flex flex-col gap-3 border-t border-white/60 pt-4">
        <h3 className="text-[13px] font-bold text-[#0f172a]">Kênh nhận cảnh báo</h3>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {channels.map(({ id, label, desc, icon: Icon, enabled }) => (
            <li
              key={id}
              className={`flex items-start gap-3 rounded-[16px] border border-white/70 px-4 py-3 transition-all ${
                enabled ? "bg-white/60" : "bg-white/35"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#10b981]/12">
                <Icon size={15} strokeWidth={2.2} color={COLOR.emeraldDark} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[12px] font-semibold text-[#0f172a]">{label}</span>
                <span className="text-[11px] leading-[1.45] text-[#64748b]">{desc}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={label}
                onClick={() => toggleChannel(id)}
                className={`relative mt-[2px] h-[22px] w-[40px] shrink-0 rounded-full border transition-all ${FOCUS} ${
                  enabled ? "border-transparent bg-[#10b981]" : "border-white/70 bg-white/60"
                }`}
              >
                <span
                  className={`absolute top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full bg-white shadow-[0_2px_5px_rgba(15,23,42,0.28)] transition-all ${
                    enabled ? "left-[21px]" : "left-[3px]"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Phân quyền & quản lý người dùng ─────────────────────────── */
function UsersCard({ onSaved }) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return USERS.filter((u) => {
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [roleFilter, query]);

  const roleCounts = useMemo(() => {
    const base = { all: USERS.length };
    Object.keys(ROLES).forEach((r) => {
      base[r] = USERS.filter((u) => u.role === r).length;
    });
    return base;
  }, []);

  const tabs = [{ id: "all", label: "Tất cả", color: COLOR.emeraldDark }, ...Object.entries(ROLES).map(([id, r]) => ({ id, label: r.label, color: r.color }))];

  return (
    <section className={`${GLASS} flex flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#10b981]/14">
            <Users size={19} strokeWidth={2.2} color={COLOR.emeraldDark} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-bold text-[#0f172a]">Phân quyền &amp; Quản lý người dùng</h2>
            <p className="text-[12px] text-[#64748b]">
              {USERS.length} tài khoản · phân quyền theo vai trò và phạm vi nhà xưởng phụ trách
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onSaved("Đã gửi lời mời tạo tài khoản mới");
            // TODO: mở modal / gọi API mời người dùng tại đây
          }}
          className={BTN_PRIMARY}
        >
          <UserPlus size={15} strokeWidth={2.6} />
          Thêm người dùng
        </button>
      </div>

      {/* Bộ lọc vai trò + tìm kiếm */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="glass-press inline-flex flex-wrap items-center gap-1 rounded-full border border-white/60 bg-white/45 p-1">
          {tabs.map(({ id, label }) => {
            const active = id === roleFilter;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRoleFilter(id)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-full px-[12px] py-[5px] text-[12px] font-semibold transition-all ${FOCUS} ${
                  active ? "bg-white text-[#0f172a] shadow-[0_2px_6px_-2px_rgba(15,23,42,0.25)]" : "text-[#64748b] hover:text-[#0f172a]"
                }`}
              >
                {label}
                <span className={`rounded-full px-[6px] py-[1px] text-[10px] ${active ? "bg-[#f1f5f9] text-[#64748b]" : "bg-white/70 text-[#94a3b8]"}`}>
                  {roleCounts[id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="whitespace-nowrap text-[12px] text-[#94a3b8]">{filtered.length} tài khoản</span>
          <label className="flex items-center gap-2 rounded-[10px] border-white/70 bg-white/60 px-3 py-2 backdrop-blur-[12px] focus-within:border-[#10b981]/60">
            <Search size={15} strokeWidth={2} color={COLOR.muted} className="shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên / email..."
              className="h-4 w-[170px] min-w-0 bg-transparent text-[12px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            />
          </label>
        </div>
      </div>

      {/* Danh sách tài khoản */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex items-center gap-3 rounded-t-[14px] border border-white/60 bg-white/55 px-4 py-[10px] text-[12px] font-semibold text-[#64748b] backdrop-blur-[12px]">
            <span className="min-w-[220px] flex-1">Người dùng</span>
            <span className="w-[160px] shrink-0">Vai trò</span>
            <span className="min-w-[190px] flex-1">Phạm vi phụ trách</span>
            <span className="w-[150px] shrink-0">Trạng thái</span>
            <span className="w-[90px] shrink-0 text-right">Thao tác</span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 border-x border-b border-white/60 bg-white/40 px-4 py-10 text-center">
              <Users size={22} strokeWidth={2} color={COLOR.muted} />
              <p className="text-[13px] font-semibold text-[#0f172a]">Không tìm thấy tài khoản phù hợp</p>
              <p className="text-[12px] text-[#64748b]">Thử đổi vai trò hoặc xoá từ khoá tìm kiếm.</p>
            </div>
          ) : (
            filtered.map(({ id, name, email, role, site, status, lastActive, initials, color }, idx) => {
              const roleMeta = ROLES[role];
              const RoleIcon = roleMeta.icon;
              const statusMeta = USER_STATUS[status];
              const StatusIcon = statusMeta.icon;
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 border-x border-b border-white/60 px-4 py-[12px] transition-colors hover:bg-white/70 ${
                    idx === filtered.length - 1 ? "rounded-b-[14px]" : ""
                  }`}
                >
                  {/* Avatar + tên */}
                  <div className="flex min-w-[220px] flex-1 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-semibold text-[#0f172a]">{name}</span>
                      <span className="truncate text-[11px] text-[#94a3b8]">{email}</span>
                    </div>
                  </div>

                  {/* Vai trò */}
                  <div className="w-[160px] shrink-0">
                    <span
                      className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${roleMeta.bg} ${roleMeta.text}`}
                    >
                      <RoleIcon size={12} strokeWidth={2.6} />
                      {roleMeta.label}
                    </span>
                  </div>

                  {/* Phạm vi */}
                  <div className="flex min-w-[190px] flex-1 flex-col gap-[2px]">
                    <span className="truncate text-[12px] text-[#0f172a]">{site}</span>
                    <span className="text-[11px] text-[#94a3b8]">Truy cập: {lastActive}</span>
                  </div>

                  {/* Trạng thái */}
                  <div className="w-[150px] shrink-0">
                    <span
                      className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${statusMeta.bg} ${statusMeta.text}`}
                    >
                      <StatusIcon size={12} strokeWidth={2.6} />
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Thao tác */}
                  <div className="flex w-[90px] shrink-0 justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Chỉnh sửa quyền của ${name}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/70 text-[#64748b] transition-all hover:bg-white hover:text-[#0f172a] ${FOCUS}`}
                    >
                      <UserCog size={14} strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Xoá tài khoản ${name}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/70 text-[#64748b] transition-all hover:bg-[#fee2e2] hover:text-[#991b1b] ${FOCUS}`}
                    >
                      <Trash2 size={14} strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Ma trận quyền theo vai trò */}
      <div className="flex flex-col gap-3 border-t border-white/60 pt-4">
        <h3 className="text-[13px] font-bold text-[#0f172a]">Ma trận quyền theo vai trò</h3>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Object.entries(ROLES).map(([id, meta]) => {
            const Icon = meta.icon;
            return (
              <li
                key={id}
                className="flex items-start gap-3 rounded-[16px] border border-white/70 bg-white/55 px-4 py-3"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: `${meta.color}1f` }}
                >
                  <Icon size={15} strokeWidth={2.2} color={meta.color} />
                </span>
                <div className="flex min-w-0 flex-col gap-[2px]">
                  <span className="text-[12px] font-bold text-[#0f172a]">
                    {meta.label} · {roleCounts[id]} tài khoản
                  </span>
                  <span className="text-[11px] leading-[1.45] text-[#64748b]">{meta.desc}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ────────────────────────────────
   5. TRANG CÀI ĐẶT
   ──────────────────────────────── */
export default function Settings() {
  const [toast, setToast] = useState(null);

  const notify = (message) => setToast({ message });

  return (
    <main className="flex min-h-[calc(100vh-73px)] min-w-0 flex-1 flex-col gap-6 p-6">
      {/* Tiêu đề trang + thông báo */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-[6px]">
          <h1 className="text-[24px] font-extrabold text-[#0f172a]">Cài đặt</h1>
          <p className="text-[14px] text-[#64748b]">
            Thông tin doanh nghiệp, hệ số phát thải, ngưỡng cảnh báo và phân quyền người dùng
          </p>
        </div>

        {toast && (
          <span className="glass inline-flex items-center gap-2 px-4 py-[10px] text-[12px] font-semibold text-[#059669]">
            <BadgeCheck size={15} strokeWidth={2.6} />
            {toast.message}
          </span>
        )}
      </div>

      {/* 1. Thông tin doanh nghiệp */}
      <CompanyCard company={COMPANY} onSaved={notify} />

      {/* 2. Danh sách nhà xưởng & địa điểm */}
      <SitesCard />

      {/* 3. Hệ số phát thải */}
      <EmissionFactorsCard onSaved={notify} />

      {/* 4. Cảnh báo & ngưỡng */}
      <ThresholdsCard onSaved={notify} />

      {/* 5. Phân quyền & người dùng */}
      <UsersCard onSaved={notify} />
    </main>
  );
}