/**
 * @type {import('tailwindcss').Config}
 *
 * LƯU Ý – dự án này dùng Tailwind CSS v4.
 *
 * Với v4, cấu hình được khai báo NGAY TRONG CSS (CSS-first):
 *   - `@theme { ... }`  → design tokens
 *   - `@source "..."`   → phạm vi quét class
 * Xem: ecometric-app/src/index.css
 *
 * Vì vậy file JS này KHÔNG còn cần thiết:
 *   1. Nó viết theo cú pháp v3 (`content`, `theme.extend`) – v4 bỏ qua `content`.
 *   2. Nó nằm ở gốc repo, còn Vite chạy trong `ecometric-app/`
 *      → Vite không bao giờ đọc tới file này.
 *
 * Giữ lại file rỗng chỉ để tránh nhầm lẫn; có thể xoá an toàn.
 */
export default {}