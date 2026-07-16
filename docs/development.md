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

圖片上傳（Cloudinary）由後端代理處理（`server/src/routes/upload.js`），前端不需另外設定 API Key。

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

# Cloudinary 圖片上傳
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe（已安裝 SDK，尚未串接實際扣款邏輯）
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# 伺服器 port（預設 3001）
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development

# （選填）執行 db:seed-demo 時，指定要一併灌入 demo 資料的既有真實帳號（逗號分隔的 email）
DEMO_REAL_USER_EMAILS=
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
| `npm run db:seed-demo` | 執行 `prisma/seedDemo.js`，建立涵蓋所有群組/申請狀態的完整 demo 資料（需先設定 `DEMO_REAL_USER_EMAILS`），不會刪除既有資料 |
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
