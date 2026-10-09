<div align="center">

# 🌿 EcoMetric Web Dashboard

**Hệ thống giám sát chỉ số ESG, phát thải Carbon (Scope 1/2/3) và tối ưu hóa năng lượng cho doanh nghiệp.**

Biến dữ liệu vận hành thô (điện, nước, nhiên liệu) thành quyết định giảm phát thải và chi phí có thể đo lường.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![SheetJS](https://img.shields.io/badge/SheetJS-xlsx-217346?logo=microsoftexcel&logoColor=white&style=flat-square)](https://sheetjs.com)
[![jsPDF](https://img.shields.io/badge/jsPDF-PDF-E5322D?style=flat-square)](https://github.com/parallax/jsPDF)
[![Lucide](https://img.shields.io/badge/Lucide-Icons-F56565?logo=lucide&logoColor=white&style=flat-square)](https://lucide.dev)

</div>

---

## 📖 Giới thiệu

**EcoMetric Web Dashboard** là bảng điều khiển dành cho doanh nghiệp muốn hiểu rõ – và cắt giảm – dấu chân carbon của mình. Thay vì những bảng tính rời rạc, nền tảng tập hợp dữ liệu vận hành thực tế (điện, nước, nhiên liệu) vào một giao diện duy nhất, chuẩn hoá theo **GHG Protocol (Scope 1/2/3)** và các khung báo cáo bền vững quốc tế (**GRI, SASB, TCFD**).

### 🔄 Vòng lặp giá trị

EcoMetric được thiết kế xoay quanh một vòng lặp khép kín — giá trị không nằm ở một con số, mà ở việc **quay vòng liên tục** để tối ưu từng chu kỳ:

```text
   ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────┐      ┌────────────┐
   │ Measure  │ ───▶ │ Insight  │ ───▶ │  Decide  │ ───▶ │ Act  │ ───▶ │ Remeasure  │
   └──────────┘      └──────────┘      └──────────┘      └──────┘      └────────────┘
        ▲                                                                     │
        └─────────────────────────────────────────────────────────────────────┘
```

| Bước            | Ý nghĩa                                                                       |
| :-------------- | :---------------------------------------------------------------------------- |
| **① Measure**   | Thu thập dữ liệu đo lường: điện (kWh), nước (m³), nhiên liệu (L) từ vận hành. |
| **② Insight**   | Chuyển dữ liệu thành chỉ số CO₂e, chi phí và xu hướng tiêu thụ dễ hiểu.       |
| **③ Decide**    | Xác định điểm nóng phát thải và mức ưu tiên xử lý.                            |
| **④ Act**       | Triển khai kế hoạch hành động cụ thể theo từng bước.                          |
| **⑤ Remeasure** | Đo lại sau khi hành động để kiểm chứng mức giảm — và lặp lại chu kỳ.          |

---

## ✨ Tính năng nổi bật

> **Điểm nhấn:** nhập liệu hàng loạt từ Excel/CSV · xuất báo cáo PDF/Excel đa sheet · Service Layer có fallback mock.

### 1. 📊 Tổng quan & Biểu đồ ESG / Carbon

- **Dashboard tổng quan**: thẻ KPI (CO₂e, chi phí, số bản ghi, tiết kiệm tiềm năng), biểu đồ xu hướng, cơ cấu tiêu thụ tài nguyên (donut) và cảnh báo bất thường.
- **Phát thải Carbon**: kiểm kê theo **Scope 1 / Scope 2 / Scope 3**, biểu đồ thực tế vs quỹ đạo Net Zero 2030, bản đồ nhiệt phân bổ theo nhà xưởng / chi nhánh.
- **Báo cáo ESG**: tiến độ chuẩn hoá theo GRI / SASB / TCFD, bảng chỉ số E–S–G kèm trạng thái tuân thủ và mức độ sẵn sàng kiểm toán.
- **Service Layer + Fallback mock data**: mọi trang gọi API qua `src/services/api.js`. Nếu backend FastAPI chưa chạy, giao diện **tự động quay về dữ liệu mô phỏng** và hiển thị dòng nhắc _“Đang dùng dữ liệu mô phỏng (backend chưa kết nối)”_ — không bao giờ trắng màn hình.

### 2. 📥 Nhập liệu hàng loạt (Bulk Data Input)

Component `DataUploader.jsx` cho phép đưa dữ liệu vận hành vào hệ thống bằng tệp thay vì nhập tay:

- **Kéo–thả** hoặc chọn tệp `.xlsx` / `.csv` (tối đa 15MB).
- **Bảng xem trước (Preview Table)**: từng dòng hiển thị kèm trạng thái _Hợp lệ_ / _N lỗi_; dòng lỗi được tô nền đỏ để dễ nhận ra.
- **Tự động kiểm tra lỗi**: thiếu cột bắt buộc, loại tài nguyên không hợp lệ, số lượng sai định dạng, thiếu nhà xưởng. Dòng lỗi **bị bỏ qua khi lưu** (chỉ lưu dòng hợp lệ).
- **Nhận diện định dạng số vi-VN / en-US**: hiểu đúng cả `1.250,5` (vi-VN) lẫn `1250.5` (en-US) — quan trọng vì Excel ở Việt Nam mặc định dùng dấu chấm ngăn nghìn.
- **Nhận diện tên cột linh hoạt**: chấp nhận cả tiếng Việt có/không dấu và tiếng Anh (ví dụ `Loại tài nguyên`, `loai tai nguyen`, `resource`).
- **Tải file mẫu (.xlsx)**: sinh bảng tính đúng định dạng cột ngay trên trình duyệt (tự fallback sang `.csv` nếu thiếu thư viện).

> Cột bắt buộc trong tệp: `Loại tài nguyên` · `Nhà xưởng` · `Số lượng` · `Đơn vị` · `Ngày ghi nhận`.

### 3. 📤 Xuất báo cáo nâng cao

Toàn bộ logic kết xuất tập trung tại `src/lib/export.js` — component chỉ gọi hàm, không cần biết về SheetJS hay jsPDF.

| Chức năng              | Thư viện         | Kết quả                                                                                 |
| :--------------------- | :--------------- | :-------------------------------------------------------------------------------------- |
| **Xuất dữ liệu Excel** | SheetJS (`xlsx`) | File `.xlsx` **đa sheet**: tổng hợp, phân bổ theo cơ sở, và từng trụ cột E / S / G.     |
| **Tải báo cáo PDF**    | jsPDF            | Báo cáo **ESG / Carbon** tiêu chuẩn, có bảng biểu, tự động ngắt trang và đánh số trang. |

- Có mặt trên **cả trang Báo cáo ESG và Phát thải Carbon**.
- Excel giữ **nguyên dấu tiếng Việt** (SheetJS hỗ trợ UTF-8 đầy đủ).
- PDF dùng font mặc định (Helvetica, không có glyph tiếng Việt) nên chuỗi được chuyển sang ASCII không dấu qua `deaccent()` để tránh vỡ chữ.
- Nút tự khoá khi đang kết xuất để tránh tải trùng tệp.

### 4. 🤖 AI Recommendations

- Gợi ý giải pháp giảm phát thải kèm **CAPEX, tiết kiệm/tháng, payback và ROI năm 1**.
- Lọc theo **mức ưu tiên** (Cao / Trung bình / Thấp) và **lĩnh vực** (Điện năng / Nhiên liệu / Quy trình).
- Hộp thoại **Action Plan 5 bước** + bảng so sánh KPI **Trước → Sau** cho mỗi giải pháp.

### 5. 📱 Tích hợp QR Code

- Nút QR trên Header để đồng bộ nhanh với **bản iOS App**.
- Modal render qua **React Portal** (`createPortal`) kèm logo EcoMetric chèn giữa mã (chế độ _excavate_ không phá mã).

### 6. 🎨 Tối ưu UI

- Hiệu ứng kính mờ (`backdrop-filter`) cho thanh điều hướng và lớp nền glass.
- **Modal dùng `createPortal`** render thẳng vào `document.body`, tránh lỗi containing-block do `backdrop-filter` gây ra → hộp thoại luôn căn giữa đúng toàn viewport.
- Bố cục responsive: Sidebar trên desktop, BottomNav trên di động.

---

## 🛠 Tech Stack chi tiết

| Lớp            | Công nghệ                                | Vai trò                                                                                   |
| :------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------- |
| **UI Library** | React 19                                 | Xây dựng giao diện theo component, quản lý trạng thái điều phối tab bằng `useState`.      |
| **Build Tool** | Vite 8                                   | Dev server tốc độ cao với HMR, build tối ưu production.                                   |
| **Styling**    | Tailwind CSS 4 (qua `@tailwindcss/vite`) | Utility-first CSS, design tokens, hiệu ứng glass/`backdrop-blur`.                         |
| **Charts**     | **SVG thuần (không phụ thuộc thư viện)** | Biểu đồ đường, donut, bản đồ nhiệt tự vẽ – giữ bundle nhẹ, toàn quyền kiểm soát hiển thị. |
| **API Layer**  | `fetch` (native) + `AbortController`     | Service layer tại `src/services/api.js`; timeout, hủy request, chuẩn hoá lỗi `ApiError`.  |
| **Icons**      | Lucide React                             | Bộ icon vector nhất quán, nhẹ (Leaf, Bell, Search, …).                                    |
| **QR Code**    | `qrcode.react`                           | Sinh QR code SVG kèm logo ở giữa.                                                         |
| **Excel/CSV**  | SheetJS (`xlsx`, import động)            | Đọc tệp .xlsx, sinh file mẫu và xuất dữ liệu chỉ số ra .xlsx nhiều sheet.                 |
| **PDF**        | jsPDF (`jspdf`, import động)             | Kết xuất báo cáo PDF có bảng biểu, tự ngắt trang và đánh số trang.                        |
| **Portals**    | `react-dom` `createPortal`               | Render modal ra ngoài cây DOM header để tránh lỗi containing block.                       |
| **Linting**    | Oxlint                                   | Kiểm tra chất lượng mã nguồn (`.oxlintrc.json`).                                          |
| **Font**       | Inter (400–800)                          | Typography giao diện, nạp qua Google Fonts trong `index.html`.                            |

> 💡 **Tối ưu bundle:** `xlsx` (~424 kB) và `jspdf` (~399 kB) đều được **import động (dynamic import)** nên Vite tách thành chunk riêng – chỉ tải khi người dùng thực sự bấm nút xuất, không ảnh hưởng tốc độ tải trang ban đầu.

> ⚠️ **Lưu ý kỹ thuật:** Tailwind CSS v4 **bắt buộc** phải có plugin `@tailwindcss/vite` (hoặc `@tailwindcss/postcss`) trong `vite.config.js`. Thiếu plugin này, toàn bộ class Tailwind bị bỏ qua và layout sẽ vỡ.

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

### Yêu cầu hệ thống

- **Node.js** ≥ 18
- **npm** (hoặc pnpm/yarn)

### Các bước

```bash
# 1. Di chuyển vào thư mục dự án
cd ecometric-app

# 2. Cài đặt dependencies
npm install
```

### Chạy môi trường phát triển (HMR)

```bash
npm run dev
```

Mở trình duyệt tại địa chỉ Vite in ra (mặc định **http://localhost:5173**).

> 💡 **Không cần backend để chạy thử:** nếu FastAPI chưa bật, ứng dụng tự động dùng dữ liệu mô phỏng và hiển thị nhắc nhở _“Đang dùng dữ liệu mô phỏng (backend chưa kết nối)”_. Muốn nối backend thật, xem mục **Service Layer** bên dưới để cấu hình `VITE_API_BASE_URL`.

### Build cho production

```bash
npm run build
```

### Xem thử bản build

```bash
npm run preview
```

### Kiểm tra chất lượng mã

```bash
npm run lint
```

### Tổng hợp lệnh

| Lệnh              | Mô tả                                 |
| :---------------- | :------------------------------------ |
| `npm run dev`     | Khởi động dev server với HMR.         |
| `npm run build`   | Build production vào thư mục `dist/`. |
| `npm run preview` | Xem thử bản build production tại chỗ. |
| `npm run lint`    | Chạy Oxlint kiểm tra mã nguồn.        |

---

## 📁 Cấu trúc thư mục dự án

```text
ecometric-app/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                     # Hình ảnh (hero.png, vite.svg, react.svg)
│   ├── components/                 # Khối giao diện dùng lại
│   │   ├── Topbar.jsx              # Thanh trên cùng (logo, search, QR, avatar)
│   │   ├── Sidebar.jsx             # Điều hướng trái (desktop)
│   │   ├── BottomNav.jsx           # Điều hướng đáy (mobile)
│   │   ├── MetricsCard.jsx         # Thẻ KPI (grid 2×2 mobile)
│   │   ├── ActionPriorityCard.jsx  # Top 3 việc cần làm ngay
│   │   ├── TrendChartCard.jsx      # Biểu đồ xu hướng tiêu thụ
│   │   ├── ResourceDonutCard.jsx   # Donut phân bổ nguồn lực + legend
│   │   ├── AlertsCard.jsx          # Cảnh báo bất thường
│   │   ├── UploadCard.jsx          # Tải lên dữ liệu (dashboard)
│   │   ├── DataUploader.jsx        # Kéo-thả .xlsx/.csv + bảng xem trước + file mẫu
│   │   ├── AiSuggestionsCard.jsx   # Khuyến nghị AI
│   │   ├── RecentReportsList.jsx   # Báo cáo gần đây (card/bảng)
│   │   ├── ActionPlanModal.jsx     # Hộp thoại Action Plan 5 bước
│   │   └── DataProvenanceTag.jsx   # Nhãn nguồn gốc dữ liệu
│   ├── data/
│   │   └── dashboardData.js        # Dữ liệu tĩnh (mock) cho dashboard
│   ├── hooks/
│   │   └── useApiData.js           # Hook tải dữ liệu qua service layer (loading/error/fallback)
│   ├── services/
│   │   └── api.js                  # Service layer gọi Backend FastAPI (getDashboardData / getRecommendations / getESGReport)
│   ├── lib/
│   │   ├── format.js               # Hàm định dạng & design tokens (COLOR, FOCUS)
│   │   └── export.js               # Xuất Excel (.xlsx) & báo cáo PDF (jspdf) cho ESG / Carbon
│   ├── App.jsx                     # Điều phối chính: routing theo tab + bố cục
│   ├── App.css
│   ├── index.css                   # Import Tailwind + style nền tảng
│   ├── main.jsx                    # Điểm khởi tạo React
│   ├── CarbonEmissions.jsx         # Trang phát thải Carbon
│   ├── AIRecommendations.jsx       # Trang khuyến nghị AI
│   ├── DataInput.jsx               # Trang nhập liệu vận hành (Operations)
│   ├── ESGReporting.jsx            # Trang báo cáo ESG
│   ├── QRCodeCard.jsx              # Nút + modal QR code (dùng createPortal)
│   └── Settings.jsx                # Trang cài đặt
├── index.html                      # HTML gốc (nạp font Inter, favicon, theme-color)
├── vite.config.js                  # Cấu hình Vite (plugin Tailwind v4 + React)
├── .env.example                    # Mẫu biến môi trường (VITE_API_BASE_URL, VITE_API_TIMEOUT_MS)
├── package.json
├── .oxlintrc.json                  # Cấu hình Oxlint
└── .gitignore
```

---

## 🧭 Điều hướng & các trang

| Tab          | Trang              | Mô tả                                                     |
| :----------- | :----------------- | :-------------------------------------------------------- |
| `overview`   | Dashboard          | Tổng quan KPI, xu hướng, cảnh báo, báo cáo gần đây.       |
| `operations` | Data Input         | Nhập & quản lý dữ liệu vận hành (điện, nước, nhiên liệu). |
| `carbon`     | Carbon Emissions   | Phân tích chi tiết phát thải CO₂e.                        |
| `ai`         | AI Recommendations | Gợi ý hành động giảm phát thải.                           |
| `esg`        | ESG Reporting      | Xuất dữ liệu cho báo cáo bền vững.                        |
| `settings`   | Settings           | Cấu hình hệ thống.                                        |

> Trên desktop dùng **Sidebar**, dưới breakpoint `lg` tự động chuyển sang **BottomNav**.

---

## 🔌 Service Layer & kết nối Backend FastAPI

Toàn bộ giao tiếp HTTP với backend tập trung tại **`src/services/api.js`** – đây là điểm duy nhất trong frontend biết cách gọi API. Component không tự `fetch` rải rác.

### Cấu hình môi trường

Sao chép `.env.example` thành `.env.local` và chỉnh theo môi trường của bạn:

```bash
cp .env.example .env.local
```

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT_MS=15000
```

> Vite chỉ expose các biến có tiền tố `VITE_` ra phía client. Nếu không cấu hình, base URL mặc định là `http://localhost:8000`.

### Các hàm public

| Hàm                                        | Endpoint              | Mô tả                                                                  |
| :----------------------------------------- | :-------------------- | :--------------------------------------------------------------------- |
| `getDashboardData({ period, site })`       | `GET /api/dashboard`  | Lấy KPI CO₂e, chi phí, biểu đồ xu hướng, cảnh báo…                     |
| `getRecommendations(parameters, { topK })` | `POST /recommend`     | Gửi thông số vận hành, nhận giải pháp tiết kiệm năng lượng.            |
| `getESGReport({ period, format })`         | `GET /api/esg/report` | Lấy dữ liệu báo cáo phát thải phục vụ công bố ESG.                     |
| `request(path, options)`                   | –                     | Hàm HTTP lõi: timeout, parse JSON, chuẩn hoá lỗi (có thể tái sử dụng). |
| `pingBackend()`                            | `GET /health`         | Health-check nhanh backend đã sẵn sàng chưa.                           |
| `withFallback(apiCall, fallback)`          | –                     | Bọc promise API, trả về giá trị dự phòng khi lỗi.                      |

### Xử lý lỗi

Mọi lỗi được ném dưới dạng `ApiError` (có `status`, `url`, `payload`) để phân biệt rõ:

- `err.isNetworkError` – backend tắt / sai URL / mất mạng / timeout.
- `err.isServerError` – backend trả lỗi 5xx.

### Hook tải dữ liệu dùng chung

`src/hooks/useApiData.js` gom logic gọi API khi mount, theo dõi `loading`/`error`, hủy request khi unmount, và **tự động quay về dữ liệu mock** nếu backend chưa chạy:

```js
const { data, loading, error, usingFallback, reload } = useApiData(
  (signal) => getDashboardData({ period: "month", signal }),
  { fallbackData: DASHBOARD_FALLBACK },
);
```

Khi `usingFallback === true`, giao diện hiển thị dòng nhắc _“Đang dùng dữ liệu mô phỏng (backend chưa kết nối)”_ để không gây hiểu nhầm về nguồn số liệu.

### Ví dụ gọi API trong component

```js
import { getRecommendations } from "../services/api.js";

// Gửi thông số vận hành sang FastAPI
const result = await getRecommendations({
  site: "Xuong 1",
  period: "month",
  electricityKwh: 20000,
  waterM3: 1500,
  fuelLiters: 800,
});
console.log(result.recommendations);
```

---

## 🗺 Roadmap phát triển

- [x] **Dashboard tổng quan** — KPI CO₂e, chi phí, biểu đồ xu hướng, cảnh báo bất thường.
- [x] **Service Layer & Fallback mock data** — `src/services/api.js` + hook `useApiData`, tự quay về mock khi backend chưa chạy.
- [x] **Nhập liệu hàng loạt (Bulk Data Input)** — kéo-thả Excel/CSV, bảng xem trước, kiểm tra lỗi, nhận diện số vi-VN / en-US.
- [x] **Xuất báo cáo nâng cao** — Excel đa sheet (SheetJS) và PDF báo cáo ESG/Carbon tiêu chuẩn (jsPDF).
- [x] **Phát thải Carbon theo Scope 1/2/3** — kiểm kê GHG Protocol, so sánh quỹ đạo Net Zero, bản đồ nhiệt theo cơ sở.
- [x] **Báo cáo ESG theo GRI / SASB / TCFD** — bảng chỉ số E–S–G, trạng thái tuân thủ, mức độ sẵn sàng kiểm toán.
- [x] **AI Recommendations** — gợi ý giải pháp giảm phát thải, Action Plan 5 bước, so sánh KPI Trước → Sau.
- [x] **Tối ưu UI** — kính mờ `backdrop-filter`, modal qua React Portals, responsive mobile/desktop.
- [ ] **Đồng bộ iOS App (QR Pairing)** — hoàn thiện luồng ghép nối QR, deep-link và đồng bộ hai chiều với bản iOS. _(giai đoạn sau)_
- [ ] **Kết nối dữ liệu thời gian thực** — thay mock bằng WebSocket và tích hợp đồng hồ đo thông minh (IoT meters).
- [ ] **Xác thực & phân quyền** — đăng nhập, vai trò theo phòng ban, phân quyền theo dữ liệu.
- [ ] **Quản lý nhiều cơ sở** — hệ số phát thải và đơn vị tiền tệ theo vùng.
- [ ] **Mở rộng bộ test & CI/CD** — unit/e2e test, pipeline lint + build tự động.
- [ ] **Chuyển sang TypeScript** — bật type-aware lint để tăng độ an toàn khi mở rộng.

> Giai đoạn tiếp theo tập trung vào **Đồng bộ iOS App (QR Pairing)** và kết nối dữ liệu thời gian thực.

---

## 🤝 Đóng góp

Đây là dự án nội bộ. Khi đóng góp, vui lòng:

1. Tạo nhánh theo tính năng: `feature/ten-tinh-nang`.
2. Chạy `npm run lint` và `npm run build` trước khi mở Pull Request.
3. Mô tả rõ thay đổi và ảnh hưởng tới UI/UX.

---

<div align="center">

**EcoMetric** — Đo lường hôm nay, giảm phát thải ngày mai. 🌱

</div>
