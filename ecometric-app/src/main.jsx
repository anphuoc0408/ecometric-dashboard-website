import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// CSS phải nạp SAU khi React sẵn sàng và TRƯỚC App:
// đây là nơi duy nhất import './index.css' trong toàn dự án.
// (Không import './App.css' – đó là CSS của template Vite gốc, sẽ đè style.)
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
