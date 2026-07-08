# 開發指南

## 環境需求

- Node.js 18+
- MySQL 8+
- Redis 7+（Mac 用 `brew install redis`）

---

## 環境變數

### 前端（根目錄 `.env`）

```bash
# REST API 位址
VITE_API_BASE_URL=http://localhost:3001/api

# Imgbb 圖片上傳（https://api.imgbb.com）
VITE_IMGBB_API_KEY=
```

### 後端（`server/.env`）

```bash
# MySQL 連線字串
DATABASE_URL="mysql://root:password@localhost:3306/partymatch"

# Redis 連線字串
REDIS_URL="redis://localhost:6379"

# JWT 簽名金鑰（隨機長字串）
JWT_SECRET=
JWT_REFRESH_SECRET=

# 伺服器 port（預設 3001）
PORT=3001
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
| `npm run dev` | 啟動 Express 開發伺服器（http://localhost:3001） |
| `npx prisma migrate dev` | 執行 migration 並同步資料庫 schema |
| `npx prisma db push` | 直接同步 schema 變更（不建立 migration 歷史，適合開發期快速迭代） |
| `npx prisma studio` | 開啟資料庫視覺化介面（http://localhost:5555） |
| `npx prisma generate` | 重新產生 Prisma Client |
| `npm run db:clear-data` | 清空所有資料（保留 users 與 services），用於重設測試環境 |

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
npx prisma migrate dev

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
| 代幣 API 路由 | Schema 已完成；待實作儲值（模擬）、代管扣款、撥款、退款端點，並在核准申請時自動執行代管 | `server/src/routes/tokens.js`（待建）、`server/src/routes/applications.js`、`useAuthStore.js` |
| 鎖定群組端點 | 實作 `POST /groups/:id/lock`：`full → pending_confirmation`，設定成員訂閱 `nextBillingDate`，建立群組聊天室 | `server/src/routes/groups.js`、`useGroupStore.js` |
| 啟用服務端點 | 實作 `POST /groups/:id/activate`：`pending_activation → confirming`，設定 `confirmDeadline`（啟用時間 + 48h） | `server/src/routes/groups.js`、`useGroupStore.js`、`HostGroupView.jsx` |
| `confirming` / `disputed` 狀態流程 | 實作成員確認（即時撥款）、向平台申訴（`disputed`）、惰性自動撥款（讀取 group 時觸發） | `server/src/routes/groups.js`、`useGroupStore.js`、`MemberGroupView.jsx` |
| Google OAuth | 目前 `loginGoogle()` 回傳 stub 錯誤，需實作後端 OAuth 流程 | `useAuthStore.js`、`server/src/routes/auth.js` |
| 重設密碼寄信 | 目前 `resetPassword()` 回傳 stub 錯誤，需串接 email 服務 | `useAuthStore.js`、`server/src/routes/auth.js` |

### 中優先度

| 項目 | 說明 | 相關檔案 |
|------|------|----------|
| 帳戶儲值功能 | ProfileHeaderCard 已顯示代幣餘額；需串接儲值按鈕至 `POST /tokens/topup` | `ProfileHeaderCard.jsx`、`server/src/routes/tokens.js` |
| 帳戶交易紀錄 | 在帳號中心顯示 `token_transactions` 歷史明細 | `AccountPage.jsx`、`PersonalInfoTab.jsx` |
| RenewalModal 完整實作 | 「開始新一期」與「結束服務」為雛形，需完整測試 | `RenewalModal.jsx`、`useGroupStore.js` |
| GroupHistoryModal 入口補強 | 元件已存在，群組卡片缺少明確入口 | `GroupHistoryModal.jsx`、`HostedGroupCard.jsx` |
| 即將續訂通知 | 接近 `nextBillingDate` 時未自動提醒 | `useSubscriptionStore.js` |
| 信用評分完整機制 | 扣 / 加分邏輯尚未串通完整流程 | `useAuthStore.js`、`useMemberStore.js` |

### 低優先度

| 項目 | 說明 |
|------|------|
| 正式金流串接 | ECPay / 綠界或其他金流 API，取代目前模擬儲值 |
| WebSocket 取代輪詢 | 訊息中心目前每 5 秒 polling，WebSocket 可降低延遲 |
| 探索頁更多搜尋功能 | 目前篩選已透過 URL query params 傳遞；未來可考慮加入全文搜尋後端 API |
| 快速配對結果分頁 | 資料量大時需分頁或虛擬捲動 |
| TypeScript 型別覆蓋 | 目前全為 JavaScript |
