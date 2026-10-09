/**
 * EcoMetric – Hook tải dữ liệu qua service layer (`src/services/api.js`)
 *
 * Vì sao cần hook này?
 *   – Ba trang (Dashboard, AI Recommendations, ESG Reporting) đều có CÙNG một
 *     nhu cầu: gọi API khi mount, theo dõi loading/error, hủy request khi
 *     unmount, và quay về dữ liệu mock nếu backend chưa chạy.
 *   – Gom logic đó vào một chỗ để component chỉ còn đọc `{ data, loading, error,
 *     usingFallback, reload }`, không lặp lại useEffect ở mỗi trang.
 *
 * Quan trọng: hook KHÔNG tự bịa dữ liệu. `fallbackData` là tuỳ chọn do caller
 * truyền vào (thường là mock tĩnh), giúp giao diện không trắng màn hình khi
 * demo mà backend FastAPI chưa chạy.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} fetcher – hàm gọi API, nhận AbortSignal
 * @param {object} [options]
 * @param {T} [options.fallbackData]      – dữ liệu dùng khi API lỗi (thường là mock)
 * @param {any[]} [options.deps=[]]        – phụ thuộc để gọi lại (ví dụ: [period])
 * @param {boolean} [options.skip=false]   – bỏ qua lần gọi đầu (khi chưa đủ điều kiện)
 * @param {(data: T) => T} [options.transform] – chuẩn hoá payload trước khi lưu state
 * @returns {{ data: T|null, loading: boolean, error: Error|null, usingFallback: boolean, reload: () => void }}
 */
export function useApiData(
  fetcher,
  { fallbackData, deps = [], skip = false, transform } = {},
) {
  const [data, setData] = useState(fallbackData ?? null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  // Bộ đếm để `reload()` buộc useEffect chạy lại mà không cần đổi deps.
  const [reloadToken, setReloadToken] = useState(0);

  // Giữ fetcher/transform/fallback trong ref để không đưa chúng vào deps của
  // useEffect (chúng thường là arrow function tạo mới mỗi render → gây vòng lặp).
  const fetcherRef = useRef(fetcher);
  const transformRef = useRef(transform);
  const fallbackRef = useRef(fallbackData);
  fetcherRef.current = fetcher;
  transformRef.current = transform;
  fallbackRef.current = fallbackData;

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result = await fetcherRef.current(controller.signal);
        if (!active) return;
        setData(transformRef.current ? transformRef.current(result) : result);
        setUsingFallback(false);
      } catch (err) {
        // Request bị hủy do unmount / đổi deps → không phải lỗi thật.
        if (!active || controller.signal.aborted) return;
        setError(err);
        // Có mock dự phòng → hiển thị mock và đánh dấu để UI cảnh báo.
        if (fallbackRef.current !== undefined) {
          setData(fallbackRef.current);
          setUsingFallback(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, reloadToken, ...deps]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return { data, loading, error, usingFallback, reload };
}

export default useApiData;
