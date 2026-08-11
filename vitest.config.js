import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: false,
    // 明確只掃根目錄的 tests/，不然預設會連 server/tests/（後端專用的 Vitest 設定、
    // 需要獨立的測試資料庫）都掃進來一起跑，兩邊環境完全不相容
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
