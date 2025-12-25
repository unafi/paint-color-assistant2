import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 全てのネットワークインターフェースでリッスン
    port: 5173,      // ポート番号を明示的に指定
  },
})
