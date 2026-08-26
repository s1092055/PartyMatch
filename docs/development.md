# 開發指南

## 1. 環境需求

- Node.js 22+
- MySQL 8+
- Redis 7+

## 2. 專案結構

前後端是同一個 repo 底下的兩個獨立專案：根目錄是前端（React + Vite），`server/` 是後端（Express），各自有自己的 `package.json`、`.env`、`node_modules`，要分開 `npm install`。

## 3. 環境變數

前端（根目錄 `.env`，範例見 `.env.example`）：

| 變數 | 用途 |
|------|------|
| `VITE_API_BASE_URL` | 後端 API 位址（本機預設 `http://localhost:3001/api`） |

後端（`server/.env`，範例見 `server/.env.example`）：

| 變數 | 用途 |
|------|------|
| `DATABASE_URL` | MySQL 連線字串 |
| `REDIS_URL` | Redis 連線字串 |
| `JWT_ACCESS_SECRET`／`JWT_REFRESH_SECRET` | JWT 簽名金鑰 |
| `JWT_ACCESS_EXPIRES`／`JWT_REFRESH_EXPIRES` | token 效期（預設 `15m`／`7d`） |
| `CREDENTIAL_ENCRYPTION_KEY` | `Group.sharedCredentials` 欄位加密金鑰（AES-256-GCM，64 字元 hex） |
| `R2_ACCOUNT_ID`／`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY`／`R2_BUCKET_NAME` | Cloudflare R2 圖片/附件上傳 |
| `PORT` | 伺服器 port（預設 `3001`） |
| `CLIENT_ORIGIN` | CORS 允許的前端來源（本機預設 `http://localhost:5173`） |

## 4. 安裝

```bash
# 前端
npm install

# 後端
cd server
npm install   # postinstall 會自動跑 prisma generate
```

## 5. 資料庫設定

本專案不維護 migration 歷史，schema 異動一律用 `db push` 同步：

```bash
cd server
npx prisma db push
```

`npx prisma studio` 可開啟資料庫視覺化介面（port 5555）。

## 6. Redis

需要一個本機或雲端的 Redis 服務，連線字串填進 `REDIS_URL`。目前用途是儲存 refreshToken session，尚未用於一般資料快取。

## 7. 啟動開發伺服器

```bash
# 前端（port 5173）
npm run dev

# 後端（port 3001，另開一個終端機視窗）
cd server
npm run dev
```

## 8. 建立服務目錄資料

```bash
cd server
npm run db:seed         # 服務目錄
npm run db:clear        # 清空使用者與業務資料（保留 services），會要求輸入 yes 確認
```

## 9. 測試

```bash
# 前端：Vitest + React Testing Library，測共用元件、Zustand store 與核心頁面/彈窗整合行為
npm test

# 後端：Vitest + Supertest，打真實 Express app，需要獨立的 partymatch_test 資料庫
cd server
npm test
```

## 10. Lint / Build

```bash
npm run lint    # ESLint，並比對前後端服務目錄（serviceCatalog.js／server/prisma/seed.js）是否同步
npm run build   # 前端 production 建置
```

## 11. CI 與部署

GitHub Actions（push/PR 自動觸發）：前端 lint + test + build，後端跑測試（含獨立的測試資料庫），兩者平行執行。

部署：前端 Cloudflare Workers（靜態資源＋SPA fallback，同時反向代理 API 請求到後端，讓瀏覽器眼中前後端是同一個 origin，避免登入憑證需要跨網域 Cookie）；後端 Render（長駐 Node process，非 serverless，因為架構用了持續連線的 Redis 與 polling）；資料庫 MySQL 相容雲端服務；Redis 雲端代管服務；圖片上傳 Cloudflare R2。

## 待完成項目

規劃中的功能與已知技術債整理在[未來規劃](portfolio/future-roadmap.md)。
