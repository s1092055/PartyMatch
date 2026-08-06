import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// 每次 build 各算一次，塞進 client bundle（透過 define）跟 dist/version.json 兩邊，
// 讓執行中的舊分頁可以拿自己記得的值跟伺服器上最新的值比對，偵測「有新版本部署了」
const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

// 寫一份不會被 Vite 加 hash 的 version.json 到 dist 根目錄，client 端輪詢這支檔案
// （不是解析 index.html）來判斷目前部署的版本是否變了
function versionFilePlugin() {
  return {
    name: 'write-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId }),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFilePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
})
