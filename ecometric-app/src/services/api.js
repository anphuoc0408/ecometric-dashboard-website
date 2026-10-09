/**
 * EcoMetric – Service layer kết nối Backend FastAPI
 *
 * Nhiệm vụ: là ĐIỂM DUY NHẤT trong toàn bộ frontend biết cách gọi HTTP tới
 * backend. Mọi component (Dashboard, AI Recommendations, ESG Reporting…)
 * chỉ việc import các hàm ở đây, KHÔNG tự `fetch` rải rác.
 *
 * Vì sao dùng `fetch` thay vì axios?
 *   – Dự án đang ở MVP, nhu cầu chỉ là GET/POST JSON + timeout. `fetch` có sẵn
 *     trong trình duyệt nên KHÔNG thêm dependency, giữ bundle nhẹ.
 *   – Việc timeout, parse lỗi, abort… được đóng gói trong `request()` bên dưới.
 *   Nếu sau này cần interceptor / retry phức tạp, chỉ cần đổi ruột `request()`
 *   sang axios mà không phải sửa bất kỳ component nào.
 *
 * Cấu hình endpoint:
 *   – Base URL đọc từ biến môi trường `VITE_API_BASE_URL` (Vite yêu cầu tiền tố
 *     `VITE_`). Tạo file `.env.local` ở thư mục `ecometric-app/`:
 *         VITE_API_BASE_URL=http://localhost:8000
 *   – Nếu không cấu hình, mặc định trỏ về FastAPI dev server http://localhost:8000.
 *
 * Chiến lược an toàn (mock fallback):
 *   – Nếu backend chưa chạy / lỗi mạng → tuỳ chọn `fallback` cho phép trả về
 *     dữ liệu mock tĩnh thay vì ném lỗi, để giao diện không trắng màn hình khi
 *     demo. Đặt `fallback: true` ở tầng caller (hook) – xem ghi chú trong file.
 */

/* ────────────────────────────────
   1. CẤU HÌNH
   ──────────────────────────────── */

/** Base URL của FastAPI. Đặt trong .env.local: VITE_API_BASE_URL=http://localhost:8000 */
export const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

/** Thời gian chờ tối đa cho một request (ms). FastAPI chạy phân tích AI có thể lâu hơn. */
export const API_TIMEOUT_MS = Number(
  import.meta.env?.VITE_API_TIMEOUT_MS ?? 15_000,
);

/** Các route endpoint – tập trung một chỗ để dễ đổi khi backend tách version. */
export const ENDPOINTS = {
  dashboard: "/api/dashboard",
  recommend: "/recommend",
  esgReport: "/api/esg/report",
};

/* ────────────────────────────────
   2. LỚP LỖI RIÊNG
   ──────────────────────────────── */

/**
 * Lỗi API có cấu trúc – giúp UI phân biệt "hết thời gian chờ" với "404" hay
 * "backend trả 500" mà không phải so sánh chuỗi message.
 */
export class ApiError extends Error {
  constructor(
    message,
    { status = 0, url = "", payload = null, cause = null } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status; // HTTP status (0 = lỗi mạng/timeout, không có response)
    this.url = url;
    this.payload = payload; // body JSON lỗi từ backend (nếu có)
    this.cause = cause;
  }

  /** true khi lỗi do không kết nối được (backend tắt, sai URL, mất mạng, timeout). */
  get isNetworkError() {
    return this.status === 0;
  }

  /** true khi backend báo lỗi phía server (5xx). */
  get isServerError() {
    return this.status >= 500;
  }
}

/* ────────────────────────────────
   3. HÀM REQUEST DÙNG CHUNG
   ──────────────────────────────── */

/**
 * Gọi HTTP tới FastAPI kèm timeout, parse JSON và chuẩn hoá lỗi.
 *
 * @param {string} path        – đường dẫn tương đối, ví dụ ENDPOINTS.dashboard
 * @param {object} [options]
 * @param {string} [options.method="GET"]
 * @param {object|null} [options.body]     – object sẽ được JSON.stringify
 * @param {object} [options.headers]
 * @param {AbortSignal} [options.signal]   – tín hiệu hủy từ bên gọi (useEffect cleanup)
 * @param {number} [options.timeoutMs]     – ghi đè API_TIMEOUT_MS cho riêng request này
 * @returns {Promise<any>} dữ liệu JSON đã parse
 * @throws {ApiError}
 */
export async function request(path, options = {}) {
  const {
    method = "GET",
    body = null,
    headers = {},
    signal: externalSignal,
    timeoutMs = API_TIMEOUT_MS,
  } = options;

  const url = `${API_BASE_URL}${path}`;

  // Gộp timeout (tự tạo) với signal của caller: cái nào hủy trước thì thắng.
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = externalSignal
    ? AbortSignal.any([externalSignal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(url, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Đọc text trước rồi mới JSON.parse để xử lý được cả response rỗng (204).
    const raw = await response.text();
    const payload = raw ? safeJsonParse(raw) : null;

    if (!response.ok) {
      throw new ApiError(
        payload?.detail ||
          payload?.message ||
          `Backend trả lỗi ${response.status}`,
        { status: response.status, url, payload },
      );
    }

    return payload;
  } catch (error) {
    // Lỗi đã là ApiError (ví dụ !response.ok ở trên) → ném tiếp nguyên trạng.
    if (error instanceof ApiError) throw error;

    // Caller chủ động hủy (component unmount) → ném lại để useEffect bỏ qua.
    if (externalSignal?.aborted) throw error;

    // Timeout do timer của chính ta tạo.
    if (timeoutController.signal.aborted) {
      throw new ApiError(`Hết thời gian chờ (${timeoutMs}ms) khi gọi ${path}`, {
        url,
        cause: error,
      });
    }

    // Còn lại: không kết nối được tới backend.
    throw new ApiError(
      `Không kết nối được Backend FastAPI tại ${API_BASE_URL}`,
      {
        url,
        cause: error,
      },
    );
  } finally {
    clearTimeout(timer);
  }
}

/** JSON.parse an toàn – backend trả HTML (ví dụ trang lỗi) cũng không làm sập app. */
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text.slice(0, 300) };
  }
}

/* ────────────────────────────────
   4. CÁC HÀM NGHIỆP VỤ (public API)
   ──────────────────────────────── */

/**
 * getDashboardData – Lấy dữ liệu tổng quan cho Dashboard:
 * KPI CO₂e, chi phí, biểu đồ xu hướng, cơ cấu tài nguyên, cảnh báo…
 *
 * Backend endpoint: GET /api/dashboard
 *
 * @param {object} [params]
 * @param {"month"|"quarter"|"year"} [params.period="month"] – mốc thời gian
 * @param {string} [params.site]                             – lọc theo nhà máy (tuỳ chọn)
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<object>} payload dashboard
 */
export async function getDashboardData({
  period = "month",
  site,
  signal,
} = {}) {
  const query = new URLSearchParams({ period });
  if (site) query.set("site", site);

  return request(`${ENDPOINTS.dashboard}?${query.toString()}`, { signal });
}

/**
 * getRecommendations – Gửi thông số vận hành sang FastAPI và nhận về danh sách
 * giải pháp tiết kiệm năng lượng / giảm phát thải do mô hình đề xuất.
 *
 * Backend endpoint: POST /recommend
 *
 * Thông số vận hành (`parameters`) là object tự do theo schema backend, ví dụ:
 *   {
 *     electricityKwh: 20000,   // điện tiêu thụ (kWh)
 *     waterM3: 1500,           // nước (m³)
 *     fuelLiters: 800,         // nhiên liệu (L)
 *     site: "Xuong 1",
 *     period: "month",
 *   }
 *
 * @param {object} parameters – thông số vận hành
 * @param {object} [options]
 * @param {number} [options.topK]        – giới hạn số giải pháp trả về
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} payload chứa danh sách khuyến nghị
 */
export async function getRecommendations(
  parameters = {},
  { topK, signal } = {},
) {
  const body = { ...parameters };
  if (topK != null) body.top_k = topK;

  return request(ENDPOINTS.recommend, { method: "POST", body, signal });
}

/**
 * getESGReport – Lấy dữ liệu báo cáo phát thải phục vụ công bố bền vững ESG.
 *
 * Backend endpoint: GET /api/esg/report
 *
 * @param {object} [params]
 * @param {"month"|"quarter"|"year"} [params.period="quarter"]
 * @param {"json"|"csv"|"xlsx"|"pdf"} [params.format="json"] – định dạng kết xuất
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<object>} payload báo cáo ESG
 */
export async function getESGReport({
  period = "quarter",
  format = "json",
  signal,
} = {}) {
  const query = new URLSearchParams({ period, format });
  return request(`${ENDPOINTS.esgReport}?${query.toString()}`, { signal });
}

/* ────────────────────────────────
   5. TIỆN ÍCH BỔ TRỢ
   ──────────────────────────────── */

/**
 * Health-check nhanh để biết backend đã sẵn sàng chưa (dùng cho banner "đang
 * dùng dữ liệu mô phỏng" khi backend chưa chạy).
 *
 * @returns {Promise<boolean>}
 */
export async function pingBackend() {
  try {
    await request("/health", { timeoutMs: 3_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Bọc một promise API: nếu thất bại thì trả về `fallbackValue` thay vì ném lỗi.
 * Dùng ở tầng hook để giao diện vẫn hiển thị dữ liệu mock khi backend chưa bật.
 *
 * @template T
 * @param {() => Promise<T>} apiCall
 * @param {T} fallbackValue
 * @returns {Promise<T>}
 */
export async function withFallback(apiCall, fallbackValue) {
  try {
    return await apiCall();
  } catch {
    return fallbackValue;
  }
}
