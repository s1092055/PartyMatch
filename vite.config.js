import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
})
