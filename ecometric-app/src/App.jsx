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
import { useState } from "react";

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

  // Gọi API tổng quan; nếu backend chưa sẵn sàng → dùng DASHBOARD_FALLBACK.
  const { data, loading, usingFallback } = useApiData(
    (signal) => getDashboardData({ period: "month", signal }),
    { fallbackData: DASHBOARD_FALLBACK },
  );

  // Ưu tiên dữ liệu từ API, thiếu trường nào thì lấy từ mock để không vỡ layout.
  const view = { ...DASHBOARD_FALLBACK, ...(data ?? {}) };

  return (
    <main className="glass flex min-w-0 flex-1 flex-col gap-5 p-4 pb-24 sm:gap-6 sm:p-6 lg:pb-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col gap-[6px]">
        <h1 className="text-[20px] font-extrabold leading-tight text-[#0f172a] sm:text-[24px]">
          {view.pageTitle}
        </h1>
        <p className="text-[13px] leading-snug text-[#64748b] sm:text-[14px]">
          {view.pageSubtitle}
        </p>
        {(loading || usingFallback) && (
          <p className="text-[11px] font-semibold text-[#94a3b8]">
            {loading ? "Đang tải dữ liệu từ máy chủ…" : "Đang dùng dữ liệu mô phỏng (backend chưa kết nối)"}
          </p>
        )}
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

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Inter',ui-sans-serif,system-ui,sans-serif] leading-[normal] text-[#0f172a] antialiased">
      <Topbar />

      {/* main-container: lớp kính mờ nền (Figma: blur 15px, trắng 30%) */}
      <div className="flex items-start bg-white/30 backdrop-blur-[15px]">
        <Sidebar active={activeNav} onChange={setActiveNav} />

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
