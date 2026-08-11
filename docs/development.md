# 開發指南

## 環境需求

- Node.js 22+
- MySQL 8+
- Redis 7+

## 環境變數

前端／後端各自需要一份 `.env`（範例見 `.env.example`），主要是 API 位址、資料庫／Redis 連線字串、JWT 簽名金鑰、圖片上傳服務的憑證。不要把 `.env` commit 到 Git。

## 常用指令

- `npm run dev`：啟動開發伺服器（前端 Vite、後端 Express 各自在自己的目錄執行）
- `npm run build`：前端 production 建置
- `npm run lint`：ESLint 檢查
- Prisma：本專案用 `db push` 同步 schema，沒有維護 migration 歷史
- 另外有整理測試資料用的 seed / 清空腳本，供本機開發與展示環境重置使用
- `npm test`（後端）：Vitest + Supertest 打真實 Express app + 獨立的測試資料庫，目前涵蓋群組生命週期（申請 → 審核 → 鎖定 → 啟用 → 確認 → 撥款）這條牽涉狀態機與金流的核心路徑

## 部署

前端：Cloudflare Workers（靜態資源＋SPA fallback，同時反向代理 API 請求到後端，讓瀏覽器眼中前後端是同一個 origin，避免登入憑證需要跨網域 Cookie）。後端：Render（長駐 Node process，非 serverless，因為架構用了持續連線的 Redis 與 polling）。資料庫：MySQL 相容的雲端服務。Redis：雲端代管服務。圖片上傳：Cloudflare R2。

## 待完成項目

規劃中的功能與已知技術債整理在 [未來規劃](portfolio/future-roadmap.md)。
