import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    // 打真的 MySQL 測試資料庫，每個測試檔案內的案例照順序跑、共用同一個連線，
    // 平行執行多個檔案容易讓 resetDb() 互相打架
    fileParallelism: false,
  },
})
