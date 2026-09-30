import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Tailwind v4 KHÔNG tự chạy qua `@import "tailwindcss"` – bắt buộc phải có plugin này
// (hoặc @tailwindcss/postcss). Thiếu nó → toàn bộ class Tailwind bị bỏ qua → layout vỡ.
export default defineConfig({
  plugins: [tailwindcss(), react()],
})
