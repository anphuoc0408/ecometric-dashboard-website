/**
 * EcoMetric – Dashboard (Tổng quan) – Điều phối chính.
 * Nguồn thiết kế: Figma "EcoMetric - Web App MVP" › frame `ecometric-dashboard` (node 3:4, 1440 × 1530)
 *
 * File này chỉ còn nhiệm vụ ĐIỀU PHỐI (routing theo tab + bố cục trang).
 * Mọi khối giao diện đã được tách sang `./components/*`:
 *
 *   Topbar · Sidebar · BottomNav
 *   MetricsCard          – Top KPI (2×2 trên mobile)
 *   ActionPriorityCard   – Top 3 việc cần làm ngay (thẻ dọc trên mobile)
 *   ResourceDonutCard    – Donut + legend xuống dưới trên mobile
 *   RecentReportsList    – Card list trên mobile / bảng trên desktop
 *   TrendChartCard · AlertsCard · UploadCard · AiSuggestionsCard
 *   ActionPlanModal      – Hộp thoại Action Plan 5 bước
 *
 * Dữ liệu tĩnh nằm ở `./data/dashboardData.js`, hàm định dạng &
 * design tokens nằm ở `./lib/format.js`.
 *
 * Stack: React + Tailwind CSS v4 + lucide-react
 * Font: Inter (400 / 500 / 600 / 700 / 800) – thêm vào index.html:
 *   <link rel="preconnect" href="https://fonts.googleapis.com" />
 *   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
 *   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
 */
import { useEffect, useState } from "react";

import DataInput from "./DataInput.jsx";
import CarbonEmissions from "./CarbonEmissions.jsx";
import AIRecommendations from "./AIRecommendations.jsx";
import ESGReporting from "./ESGReporting.jsx";
import Settings from "./Settings.jsx";

import Topbar from "./components/Topbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import MetricsGrid from "./components/MetricsCard.jsx";
import ActionPriorityCardList from "./components/ActionPriorityCard.jsx";
import TrendChartCard from "./components/TrendChartCard.jsx";
import ResourceDonutCard from "./components/ResourceDonutCard.jsx";
import AlertsCard from "./components/AlertsCard.jsx";
import UploadCard from "./components/UploadCard.jsx";
import AiSuggestionsCard from "./components/AiSuggestionsCard.jsx";
import RecentReportsList from "./components/RecentReportsList.jsx";
import ActionPlanModal from "./components/ActionPlanModal.jsx";

import {
  ACTIONABLE_PRIORITIES,
  ALERTS,
  BOTTOM_NAV_ITEMS,
  METRICS,
  PAGE_SUBTITLE,
  PAGE_TITLE,
  REPORTS,
  RESOURCES,
  SUGGESTIONS,
  TREND_BARS,
  TREND_POINTS,
  X_LABELS,
  Y_LABELS,
} from "./data/dashboardData.js";
import { getDashboardData } from "./services/api.js";
import useApiData from "./hooks/useApiData.js";


/* ────────────────────────────────────────────────────────────────
   DỮ LIỆU MOCK DỰ PHÒNG CHO DASHBOARD
   Gom các hằng tĩnh vào một object để truyền làm `fallbackData` cho hook.
   Khi backend FastAPI chưa chạy, giao diện vẫn hiển thị đủ số liệu demo.
   ──────────────────────────────────────────────────────────────── */
const DASHBOARD_FALLBACK = {
  pageTitle: PAGE_TITLE,
  pageSubtitle: PAGE_SUBTITLE,
  metrics: METRICS,
  priorities: ACTIONABLE_PRIORITIES,
  trend: { points: TREND_POINTS, bars: TREND_BARS, xLabels: X_LABELS, yLabels: Y_LABELS },
  resources: RESOURCES,
  alerts: ALERTS,
  suggestions: SUGGESTIONS,
  reports: REPORTS,
};

/* ────────────────────────────────────────────────────────────────
   TRANG TỔNG QUAN (Dashboard)
   ──────────────────────────────────────────────────────────────── */
function OverviewPage({ onGoToAI }) {
  // Khối "Top 3 việc cần làm ngay" mở Action Plan dạng hộp thoại ngay trên Dashboard
  const [planItem, setPlanItem] = useState(null);
  const [period, setPeriod] = useState("month");
  const [site, setSite] = useState("all");

  // Gọi API tổng quan; nếu backend chưa sẵn sàng → dùng DASHBOARD_FALLBACK.
  const { data, loading, usingFallback } = useApiData(
    (signal) =>
      getDashboardData({
        period,
        site: site === "all" ? undefined : site,
        signal,
      }),
    { fallbackData: DASHBOARD_FALLBACK, deps: [period, site] },
  );

  // Ưu tiên dữ liệu từ API, thiếu trường nào thì lấy từ mock để không vỡ layout.
  const view = { ...DASHBOARD_FALLBACK, ...(data ?? {}) };

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-24 sm:gap-6 sm:p-6 lg:pb-6">
      {/* Header khu vực Tổng quan */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {/* Tiêu đề & mô tả */}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[20px] font-bold tracking-tight text-slate-900 sm:text-[22px]">
              {view.pageTitle}
            </h1>
            {/* Pill trạng thái nhỏ tinh tế */}
            {loading ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Đang tải dữ liệu…
              </span>
            ) : usingFallback ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500"
                title="Đang dùng dữ liệu mô phỏng chuẩn (backend chưa kết nối)"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Dữ liệu mô phỏng
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Trực tuyến
              </span>
            )}
          </div>
          <p className="text-[13px] leading-snug text-slate-500">
            {view.pageSubtitle}
          </p>
        </div>

        {/* Các điều khiển lọc / kỳ dữ liệu ở góc phải */}
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {/* Lọc cơ sở */}
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            aria-label="Chọn cơ sở lọc dữ liệu"
            className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 pr-7 text-[12px] font-medium text-slate-700 shadow-xs outline-none transition-colors hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          >
            <option value="all">Toàn bộ cơ sở</option>
            <option value="Xuong 1">Xưởng 1</option>
            <option value="Xuong 2">Xưởng 2</option>
            <option value="Khu B">Khu B</option>
          </select>

          {/* Kỳ dữ liệu (Tháng / Quý / Năm) */}
          <div
            role="group"
            aria-label="Kỳ dữ liệu"
            className="inline-flex h-8.5 items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-[12px]"
          >
            {[
              { id: "month", label: "Tháng" },
              { id: "quarter", label: "Quý" },
              { id: "year", label: "Năm" },
            ].map(({ id, label }) => {
              const active = period === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPeriod(id)}
                  aria-pressed={active}
                  className={`rounded-md px-2.5 py-1 text-[12px] transition-all ${
                    active
                      ? "bg-white font-semibold text-slate-900 shadow-xs"
                      : "font-medium text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hàng chỉ số KPI – Grid 2×2 trên mobile, 4 cột từ xl */}
      <MetricsGrid metrics={view.metrics} />

      {/* Khối nổi bật: Top 3 việc cần làm ngay trong tháng
          (thẻ dọc trên mobile → 3 cột từ xl) */}
      <ActionPriorityCardList
        items={view.priorities}
        onOpenPlan={(item) => setPlanItem(item)}
        onGoToAI={onGoToAI}
      />

      {/* Biểu đồ + cột phải */}
      <div className="flex flex-col items-stretch gap-5 xl:flex-row">
        <TrendChartCard trend={view.trend} />
        <div className="flex w-full shrink-0 flex-col gap-5 xl:w-[420px]">
          <ResourceDonutCard resources={view.resources} />
          <AlertsCard alerts={view.alerts} />
        </div>
      </div>

      {/* Tải file + khuyến nghị AI */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <UploadCard />
        <AiSuggestionsCard suggestions={view.suggestions} />
      </div>

      {/* Báo cáo: card list trên mobile, bảng trên desktop */}
      <RecentReportsList reports={view.reports} />

      {/* Hộp thoại Action Plan 5 bước */}
      {planItem && <ActionPlanModal item={planItem} onClose={() => setPlanItem(null)} />}
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────
   TRANG ECOMETRIC – điều phối theo tab
   (Sidebar trên desktop · BottomNav trên di động)
   ──────────────────────────────────────────────────────────────── */
export default function App() {
  const [activeNav, setActiveNav] = useState("overview");

  // Khi mở link trực tiếp hoặc từ mã QR có ?pair_session=..., vào thẳng trang web
  // và tự động xóa param đó khỏi thanh địa chỉ bằng window.history.replaceState để URL luôn sạch.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("pair_session")) {
        url.searchParams.delete("pair_session");
        window.history.replaceState(
          {},
          document.title,
          url.pathname + (url.search ? url.search : "") + url.hash,
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Inter',ui-sans-serif,system-ui,sans-serif] leading-[normal] text-[#0f172a] antialiased">
      <Topbar />

      {/* Sidebar nằm NGOÀI container để `fixed top-[73px] h-[calc(100vh-73px)]` luôn đúng. */}
      <Sidebar active={activeNav} onChange={setActiveNav} />

      {/* main-container: nền sạch, chừa đúng bề rộng Sidebar thu gọn (w-20) */}
      <div className="flex items-start lg:pl-20">
        {activeNav === "operations" ? (
          <DataInput />
        ) : activeNav === "carbon" ? (
          <CarbonEmissions />
        ) : activeNav === "ai" ? (
          <AIRecommendations />
        ) : activeNav === "esg" ? (
          <ESGReporting />
        ) : activeNav === "settings" ? (
          <Settings />
        ) : (
          <OverviewPage onGoToAI={() => setActiveNav("ai")} />
        )}
      </div>

      {/* Điều hướng đáy – chỉ hiện dưới lg (khi Sidebar đã ẩn) */}
      <BottomNav items={BOTTOM_NAV_ITEMS} active={activeNav} onChange={setActiveNav} />
    </div>
  );
}
