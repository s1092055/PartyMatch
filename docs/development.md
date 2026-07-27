# 開發指南

## 環境需求

- Node.js 22+（`server/package.json` 的 `engines.node` 要求）
- MySQL 8+
- Redis 7+（Mac 用 `brew install redis`）

---

## 環境變數

### 前端（根目錄 `.env`）

```bash
# REST API 位址
VITE_API_BASE_URL=http://localhost:3001/api
```

圖片上傳經後端代理至 Cloudflare R2（`server/src/routes/upload.js`），前端不需另外設定任何 API Key。

### 後端（`server/.env`）

```bash
# MySQL 連線字串
DATABASE_URL="mysql://root@localhost:3306/partymatch"

# Redis 連線字串
REDIS_URL=redis://localhost:6379

# JWT 簽名金鑰（隨機長字串）
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Cloudflare R2 圖片上傳
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Stripe（已安裝 SDK，尚未串接實際扣款邏輯）
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# 伺服器 port（預設 3001）
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

不要把 `.env` 檔案 commit 到 Git。

---

## 常用指令

### 前端

| 指令 | 用途 |
|------|------|
| `npm run dev` | 啟動 Vite 開發伺服器（http://localhost:5173） |
| `npm run build` | 建置 production bundle |
| `npm run lint` | 執行 ESLint |
| `npm run preview` | 本地預覽 production build |

### 後端（在 `server/` 目錄執行）

| 指令 | 用途 |
|------|------|
| `npm run dev` | 啟動 Express 開發伺服器（http://localhost:3001，`--watch` 自動重啟） |
| `npm start` | 直接啟動 Express（無 `--watch`），正式環境用 |
| `npm run db:push`（等同 `npx prisma db push`） | 同步 schema 變更到資料庫。本專案未建立 migration 歷史（無 `prisma/migrations` 目錄），一律用 `db push` 同步 |
| `npm run db:migrate`（等同 `npx prisma migrate dev`） | package.json 有此腳本，但**不要使用**——會因偵測不到既有 migration 歷史而要求重置資料庫，一律改用 `db:push` |
| `npm run db:studio`（等同 `npx prisma studio`） | 開啟資料庫視覺化介面（http://localhost:5555） |
| `npx prisma generate` | 重新產生 Prisma Client |
| `npm run db:seed` | 執行 `prisma/seed.js` 建立測試資料 |
| `npm run db:seed-demo` | 執行 `prisma/seedDemo.js`，建立 10 個自給自足的 demo 帳號（含 1 個管理員）與涵蓋所有群組/申請狀態的完整 demo 資料，需在乾淨的資料庫上執行（先 `npm run db:clear`），見 [測試帳號](testing/test-accounts.md) |
| `npm run db:clear-data` | 清空所有資料（保留 users 與 services），用於重設測試環境 |
| `npm run db:clear` | 清空所有正式版資料**含 users**（保留 services），執行前需在終端機輸入 `yes` 確認 |

---

## ESLint 設定

`eslint.config.js` 依目錄分開設定：`src/**` 套用 browser globals + React hooks 規則，`server/**` 與根目錄設定檔套用 Node globals，避免後端程式碼被誤判為瀏覽器環境（例如 `process is not defined`）。`npm run lint` 目前為零錯誤。

---

## 首次啟動流程

```bash
# 1. 確認 MySQL 和 Redis 正在執行
brew services start mysql
brew services start redis

# 2. 前端依賴
npm install

# 3. 後端依賴與資料庫初始化
cd server
npm install
npm run db:push

# 4. 開兩個 terminal 分別啟動前後端
# Terminal 1（根目錄）
npm run dev

# Terminal 2（server/）
npm run dev
```

---

## 打包專案

```bash
zip -r partymatch.zip . \
  --exclude "*/node_modules/*" \
  --exclude "*/dist/*" \
  --exclude "*/.git/*" \
  --exclude "*/.DS_Store" \
  --exclude "*/.env"
```

---

## 部署（免費方案組合）

後端是傳統 Express + Redis 長駐連線 + polling 架構（不是 serverless 設計），所以選擇能跑「持續存在的 Node process」的平台，而不是 serverless function 平台。

| 用途 | 服務 | 備註 |
|------|------|------|
| 前端（Vite SPA） | Cloudflare Workers（靜態資源） | `npm run build` 產出 `dist/`；根目錄 `wrangler.jsonc` 設定 `assets.directory: "./dist"` 與 `not_found_handling: "single-page-application"` 處理 React Router 的 SPA fallback。在 Cloudflare Dashboard 選 Workers & Pages → Create application → 連接這個 repo，Build command 填 `npm run build`，Deploy command 保持預設 `npx wrangler deploy` |
| 後端（Express） | Render 免費 Web Service | 根目錄 `render.yaml` 已設定好 Blueprint（`rootDir: server`、`buildCommand`、`startCommand`、`healthCheckPath: /health`），Render 上選 New → Blueprint 指向這個 repo 即可帶入設定。閒置 15 分鐘會休眠，下次請求約需 1 分鐘喚醒 |
| MySQL | TiDB Cloud Serverless（Starter） | PlanetScale 免費方案已下架，TiDB 是目前 MySQL 相容且免費額度足夠的選擇；連線字串需要加 `?sslaccept=strict` |
| Redis | Upstash Redis | 連線字串用 `rediss://`（TLS），`ioredis` 會自動偵測並啟用 TLS，程式碼不用改；Upstash 頁面預設顯示的是 REST API 連線資訊，要切到 **TCP** 分頁才是 `ioredis` 需要的格式 |
| 檔案上傳 | Cloudflare R2 | 已串接完成（`server/src/lib/r2Storage.js`），bucket 需另外在 Settings 裡開啟 **Public Development URL** 才能讓上傳的檔案被公開讀取 |

### 部署步驟

1. **後端環境變數**：`render.yaml` 裡標記 `sync: false` 的變數（`DATABASE_URL`、`REDIS_URL`、`CLIENT_ORIGIN`、`R2_*`）需要在 Render 後台手動填入；`JWT_ACCESS_SECRET`／`JWT_REFRESH_SECRET` 會自動產生隨機值
2. **`CLIENT_ORIGIN`** 要填前端實際部署後的網址（例如 `https://partymatch.<your-subdomain>.workers.dev`），否則 CORS 會擋掉前端的 API 請求；可以先填一個佔位值讓後端部署不卡住，前端網址確定後再回來改
3. **首次建表**：本機執行 `DATABASE_URL=<TiDB 連線字串> npx prisma db push`（在 `server/` 目錄），把 schema 同步到正式資料庫——不要把 `db push` 放進 Render 的 build command 裡自動跑，避免每次部署都意外異動 schema
4. **灌入初始資料**：`db push` 只會建表，不會有任何資料；接著在 `server/` 目錄執行 `DATABASE_URL=<TiDB 連線字串> node prisma/seed.js`（服務目錄）與 `SEED_API_BASE=<後端網址>/api DATABASE_URL=<TiDB 連線字串> node prisma/seedDemo.js`（demo 帳號/群組，透過真實 API 呼叫，`SEED_API_BASE` 要指到已部署的後端網址）
5. **前端環境變數**：`VITE_API_BASE_URL` 設成 Render 後端網址加 `/api`（例如 `https://partymatch-api.onrender.com/api`），這是建置期環境變數，要在 Cloudflare 的「Build」設定裡填，不是執行期環境變數

---

## 待完成項目

### 高優先度

| 項目 | 說明 | 相關檔案 |
|------|------|----------|
| Google OAuth | 目前 `loginGoogle()` 回傳 stub 錯誤，需實作後端 OAuth 流程 | `useAuthStore.js`、`server/src/routes/auth.js` |
| 重設密碼寄信 | 目前 `resetPassword()` 回傳 stub 錯誤，需串接 email 服務 | `useAuthStore.js`、`server/src/routes/auth.js` |
| 手機號碼簡訊驗證 | 註冊時手機號碼僅做格式驗證，未確認是否為本人持有，需串接簡訊 OTP 服務 | `RegisterPage.jsx`、`server/src/routes/auth.js` |

### 中優先度

| 項目 | 說明 | 相關檔案 |
|------|------|----------|
| 帳戶交易紀錄 | 在帳號中心顯示 `token_transactions` 歷史明細（`GET /tokens` 已回傳最近 50 筆，前端待顯示） | `AccountPage.jsx`、`PersonalInfoTab.jsx` |
| 信用評分完整機制 | 目前僅為靜態欄位（各 API 只讀取顯示），扣 / 加分邏輯與異動歷程尚未設計實作 | `useAuthStore.js`、`useMemberStore.js`、`CreditScoreBadge.jsx` |

### 低優先度

| 項目 | 說明 |
|------|------|
| 正式金流串接 | 已安裝 Stripe SDK（`server/package.json`）與對應環境變數，尚未串接實際扣款邏輯，取代目前模擬儲值 |
| WebSocket 取代輪詢 | 訊息中心目前每 5 秒 polling，WebSocket 可降低延遲 |
| 探索頁更多搜尋功能 | 目前篩選已透過 URL query params 傳遞；未來可考慮加入全文搜尋後端 API |
| 快速搜尋結果分頁 | 資料量大時需分頁或虛擬捲動 |
| TypeScript 型別覆蓋 | 目前全為 JavaScript |
