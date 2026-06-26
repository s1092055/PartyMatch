# 開發指南

## 環境變數

請在專案根目錄建立 `.env`，並填入 Firebase 專案設定。不要把實際金鑰 commit 到 Git。

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Demo 模式（讀寫 demo_* collection，不影響正式資料）
VITE_DEMO_MODE=true
DEMO_USER_EMAIL=demo@partymatch.tw
DEMO_USER_PASSWORD=demo1234
```

---

## 常用指令

| 指令 | 用途 |
|------|------|
| `npm run dev` | 啟動 Vite 開發伺服器（http://localhost:5173） |
| `npm run build` | 建置 production bundle |
| `npm run lint` | 執行 ESLint |
| `npm run preview` | 本地預覽 production build |
| `npm run seed:demo` | 建立 demo 帳號與 Firestore demo 資料 |
| `npm run clear:demo` | 清空 `demo_*` collection 中的 demo 資料 |
| `npm run clear:prod` | 清空正式 collection 資料（Auth 帳號不受影響） |
| `npm run seed:services` | 匯入服務清單資料 |

---

## Demo 資料

```bash
npm run seed:demo
```

Demo 資料與正式資料**完全分開存放**：Demo 模式下讀寫 `demo_groups`、`demo_members` 等獨立 collection，正式模式讀寫 `groups`、`members` 等，兩者不互相污染（見 `src/shared/api/demoCollection.js`）。

| 類別 | 覆蓋情境 |
|------|----------|
| 我的訂閱 | 待處理、已啟用、即將續訂；覆蓋 `pending`、`markedPaid`、`confirmed`、逾期判斷 |
| 申請紀錄 | 審核中、已拒絕 |
| 群組管理 | 招募中、已額滿、待確認付款、已啟用、已結束 |
| 通知 | 付款、申請、系統通知 |
| 收藏 | 已收藏群組 |
| 訊息 | seed 不預填對話；建立群組、核准申請或開啟 DM 時由功能流程建立 |

`scripts/utils/getRate.mjs` 會嘗試抓 USD/TWD 匯率；網路不可用時使用備用匯率。

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
| Firestore Security Rules | 正式上線前需補上後端 Rules | `firestore.rules`（待建立） |
| 資料一致性 guard | 核准申請時確保 subscription + member 同時建立 | `applicationStore.js`、`ManagePage.jsx` |
| 信用評分完整機制 | 扣 / 加分邏輯尚未串通完整流程 | `authStore.js`、`memberStore.js` |

### 中優先度

| 項目 | 說明 | 相關檔案 |
|------|------|----------|
| RenewalModal 完整實作 | 「開始新一期收款」與「結束服務」為雛形，需完整測試 | `RenewalModal.jsx`、`groupStore.js` |
| GroupHistoryModal 入口補強 | 元件已存在，群組卡片缺少明確入口 | `GroupHistoryModal.jsx`、`HostedGroupCard.jsx` |
| 逾期付款提醒流程 | `overdue` 狀態可識別但未自動觸發通知 | `subscriptionStore.js`、`notificationStore.js` |
| 即將續訂通知 | 接近 `nextBillingDate` 時未自動提醒 | `subscriptionStore.js` |

### 低優先度

| 項目 | 說明 |
|------|------|
| 正式金流串接 | ECPay / 綠界或其他金流 API |
| 2FA 身份驗證強化 | 目前僅 Email/Password + Google 登入 |
| 探索頁篩選條件 URL 分享 | 目前存於 sessionStorage |
| 快速配對結果分頁 | 資料量大時需分頁或虛擬捲動 |
